import { prisma } from '../../data/postgres';
import {
  ProductPriceFilters,
  ProductPricePointRow,
  ProductReturnRow,
  ProductVariantRow,
  PurchaseProductDatasource,
} from '../../domain';
import { ProductKeyHelper } from '../../domain/helpers/product-price.helper';

// Precio unitario a partir del cual una línea es una compra real. Debajo de esto es producto regalado:
// en los datos no hay precios entre $0.02 y $0.10 (una sola línea), así que el corte no toca compras reales
const MAX_BONUS_UNIT_PRICE = 0.01;

interface RawPricePointRow {
  supplierId: number;
  supplierName: string;
  unitOfMeasure: number;
  ref: string;
  name: string;
  documentId: number;
  controlNumber: string;
  issueDate: string;
  quantity: number | string;
  amount: number | string;
  netAmount: number | string;
}

type ProductRef = { unitOfMeasure: number; ref: string };

type RawReturnRow = { [key in keyof ProductReturnRow]: string | number };

// El producto de cada línea (productRef / productName) se calcula al importar con ProductRefHelper.
// Si el producto es una variante (ProductVariant), sus compras se cuentan como del producto principal.
// El precio sale del precio de lista menos el descuento de la línea (cantidad × precio − descuento), no del monto:
// el monto viene redondeado a centavos y en cantidades chicas mueve el precio unitario.
export class PurchaseProductDatasourceImpl implements PurchaseProductDatasource {
  async getPricePoints(filters: ProductPriceFilters): Promise<ProductPricePointRow[]> {
    const { from, to, supplierId, products, resolveVariants } = filters;
    // "unidad:código" de cada producto pedido (supplierId ya filtra el proveedor)
    const keys = products ? products.map((p) => ProductKeyHelper.localKey(p.unitOfMeasure, p.ref)) : null;

    const rows = await prisma.$queryRaw<RawPricePointRow[]>`
      WITH lines AS (
        SELECT
          d."supplierId" AS supplier_id,
          i."unitOfMeasure" AS unit,
          i."productRef" AS ref,
          i."productName" AS name,
          d."id" AS document_id,
          d."controlNumber" AS control_number,
          d."issueDate" AS issue_date,
          i."quantity" AS quantity,
          i."taxedSale" + i."exemptSale" + i."nonSubjectSale" AS amount,
          i."quantity" * i."unitPrice" - i."discount" AS net_amount
        FROM "PurchaseDocumentItem" i
        JOIN "PurchaseDocument" d ON d."id" = i."documentId"
        WHERE d."type" = 'CREDITO_FISCAL'
          AND d."voidedAt" IS NULL
          AND d."issueDate" BETWEEN ${from}::date AND ${to}::date
          AND (${supplierId}::int IS NULL OR d."supplierId" = ${supplierId}::int)
          AND i."productRef" IS NOT NULL
          AND i."quantity" > 0
          -- Bonificaciones: las rotuladas "(BONIFICACIÓN)", las de monto 0 y las facturadas a $0.01
          -- (Sello de Oro regala producto a un centavo con el mismo código que la venta normal)
          AND i."unitPrice" > ${MAX_BONUS_UNIT_PRICE}::numeric
          AND i."taxedSale" + i."exemptSale" + i."nonSubjectSale" > 0
          AND i."description" NOT ILIKE '(BONIFICACI%'
      ),
      resolved AS (
        SELECT
          l.*,
          CASE WHEN ${resolveVariants}::boolean THEN coalesce(v."targetUnitOfMeasure", l.unit) ELSE l.unit END AS product_unit,
          CASE WHEN ${resolveVariants}::boolean THEN coalesce(v."targetRef", l.ref) ELSE l.ref END AS product_ref
        FROM lines l
        LEFT JOIN "ProductVariant" v
          ON v."supplierId" = l.supplier_id AND v."unitOfMeasure" = l.unit AND v."ref" = l.ref
      )
      SELECT
        r.supplier_id AS "supplierId",
        s."name" AS "supplierName",
        r.product_unit AS "unitOfMeasure",
        r.product_ref AS "ref",
        max(r.name) AS "name",
        r.document_id AS "documentId",
        r.control_number AS "controlNumber",
        to_char(r.issue_date, 'YYYY-MM-DD') AS "issueDate",
        sum(r.quantity)::float8 AS "quantity",
        sum(r.amount)::float8 AS "amount",
        sum(r.net_amount)::float8 AS "netAmount"
      FROM resolved r
      JOIN "Supplier" s ON s."id" = r.supplier_id
      WHERE (${keys}::text[] IS NULL OR (r.product_unit::text || ':' || r.product_ref) = ANY(${keys}::text[]))
      GROUP BY r.supplier_id, s."name", r.product_unit, r.product_ref, r.document_id, r.control_number, r.issue_date
      ORDER BY r.issue_date, r.document_id
    `;

    return rows.map((row) => ({
      supplierId: Number(row.supplierId),
      supplierName: row.supplierName,
      unitOfMeasure: Number(row.unitOfMeasure),
      ref: row.ref,
      name: row.name,
      documentId: Number(row.documentId),
      controlNumber: row.controlNumber,
      issueDate: row.issueDate,
      quantity: Number(row.quantity),
      amount: Number(row.amount),
      netAmount: Number(row.netAmount),
    }));
  }

  // Cada línea de nota de crédito se relaciona con la compra que modifica por el código de generación de la línea
  // (numeroDocumento) y el código del producto, sin mirar la unidad: Avícola devuelve con 99 o 59 lo facturado por libra.
  // La merma no tiene código de un producto comprado, así que no se relaciona con ninguna compra
  async getReturns(filters: ProductPriceFilters): Promise<ProductReturnRow[]> {
    const { from, to, supplierId, products, resolveVariants } = filters;
    const keys = products ? products.map((p) => ProductKeyHelper.localKey(p.unitOfMeasure, p.ref)) : null;

    const rows = await prisma.$queryRaw<RawReturnRow[]>`
      WITH purchases AS (
        SELECT
          d."supplierId" AS supplier_id,
          d."id" AS document_id,
          upper(d."generationCode") AS generation_code,
          i."productRef" AS ref,
          i."unitOfMeasure" AS unit,
          sum(i."quantity") AS quantity,
          sum(i."quantity" * i."unitPrice") / sum(i."quantity") AS list_price
        FROM "PurchaseDocumentItem" i
        JOIN "PurchaseDocument" d ON d."id" = i."documentId"
        WHERE d."type" = 'CREDITO_FISCAL'
          AND d."voidedAt" IS NULL
          AND d."issueDate" BETWEEN ${from}::date AND ${to}::date
          AND (${supplierId}::int IS NULL OR d."supplierId" = ${supplierId}::int)
          AND i."productRef" IS NOT NULL
          AND i."quantity" > 0
          AND i."unitPrice" > ${MAX_BONUS_UNIT_PRICE}::numeric
          AND i."taxedSale" + i."exemptSale" + i."nonSubjectSale" > 0
          AND i."description" NOT ILIKE '(BONIFICACI%'
        GROUP BY 1, 2, 3, 4, 5
      ),
      returns AS (
        SELECT
          d."supplierId" AS supplier_id,
          d."id" AS document_id,
          d."controlNumber" AS control_number,
          d."issueDate" AS issue_date,
          upper(btrim(i."relatedDocumentCode")) AS related_code,
          i."productRef" AS ref,
          i."quantity" AS quantity,
          i."unitPrice" AS list_price,
          i."taxedSale" + i."exemptSale" + i."nonSubjectSale" AS amount,
          i."quantity" * i."unitPrice" - i."discount" AS net_amount
        FROM "PurchaseDocumentItem" i
        JOIN "PurchaseDocument" d ON d."id" = i."documentId"
        WHERE d."type" = 'NOTA_CREDITO'
          AND d."voidedAt" IS NULL
          AND (${supplierId}::int IS NULL OR d."supplierId" = ${supplierId}::int)
          AND i."productRef" IS NOT NULL
          AND i."quantity" > 0
      ),
      matched AS (
        SELECT
          p.*,
          r.document_id AS return_id, r.control_number, r.issue_date,
          r.quantity AS return_quantity, r.list_price AS return_list_price, r.amount, r.net_amount,
          CASE WHEN ${resolveVariants}::boolean THEN coalesce(v."targetUnitOfMeasure", p.unit) ELSE p.unit END AS product_unit,
          CASE WHEN ${resolveVariants}::boolean THEN coalesce(v."targetRef", p.ref) ELSE p.ref END AS product_ref
        FROM returns r
        JOIN purchases p ON p.supplier_id = r.supplier_id AND p.generation_code = r.related_code AND p.ref = r.ref
        LEFT JOIN "ProductVariant" v ON v."supplierId" = p.supplier_id AND v."unitOfMeasure" = p.unit AND v."ref" = p.ref
      )
      SELECT
        m.supplier_id AS "supplierId",
        m.product_unit AS "unitOfMeasure",
        m.product_ref AS "ref",
        m.document_id AS "purchaseDocumentId",
        m.quantity::float8 AS "purchaseQuantity",
        m.list_price::float8 AS "purchaseListPrice",
        m.return_id AS "documentId",
        m.control_number AS "controlNumber",
        to_char(m.issue_date, 'YYYY-MM-DD') AS "issueDate",
        m.return_quantity::float8 AS "quantity",
        m.return_list_price::float8 AS "listPrice",
        m.amount::float8 AS "amount",
        m.net_amount::float8 AS "netAmount"
      FROM matched m
      WHERE (${keys}::text[] IS NULL OR (m.product_unit::text || ':' || m.product_ref) = ANY(${keys}::text[]))
      ORDER BY m.issue_date, m.return_id
    `;

    return rows.map((row) => ({
      supplierId: Number(row.supplierId),
      unitOfMeasure: Number(row.unitOfMeasure),
      ref: String(row.ref),
      purchaseDocumentId: Number(row.purchaseDocumentId),
      purchaseQuantity: Number(row.purchaseQuantity),
      purchaseListPrice: Number(row.purchaseListPrice),
      documentId: Number(row.documentId),
      controlNumber: String(row.controlNumber),
      issueDate: String(row.issueDate),
      quantity: Number(row.quantity),
      listPrice: Number(row.listPrice),
      amount: Number(row.amount),
      netAmount: Number(row.netAmount),
    }));
  }

  async getVariants(supplierId: number | null): Promise<ProductVariantRow[]> {
    const variants = await prisma.productVariant.findMany({
      where: supplierId ? { supplierId } : {},
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return variants.map((v) => ({
      supplierId: v.supplierId,
      unitOfMeasure: v.unitOfMeasure,
      ref: v.ref,
      targetUnitOfMeasure: v.targetUnitOfMeasure,
      targetRef: v.targetRef,
      createdAt: v.createdAt,
      createdBy: v.createdBy.name,
    }));
  }

  // Une las variantes al producto principal en una transacción. Si el principal es a su vez una variante se usa
  // su principal, y las variantes de cada variante pasan al principal: nunca quedan cadenas de variantes
  async mergeProducts(supplierId: number, target: ProductRef, variants: ProductRef[], userId: number): Promise<ProductRef> {
    return prisma.$transaction(async (tx) => {
      const targetLink = await tx.productVariant.findUnique({
        where: { supplierId_unitOfMeasure_ref: { supplierId, unitOfMeasure: target.unitOfMeasure, ref: target.ref } },
      });
      const main: ProductRef = targetLink
        ? { unitOfMeasure: targetLink.targetUnitOfMeasure, ref: targetLink.targetRef }
        : target;

      for (const variant of variants) {
        if (variant.unitOfMeasure === main.unitOfMeasure && variant.ref === main.ref) continue;

        await tx.productVariant.updateMany({
          where: { supplierId, targetUnitOfMeasure: variant.unitOfMeasure, targetRef: variant.ref },
          data: { targetUnitOfMeasure: main.unitOfMeasure, targetRef: main.ref },
        });

        await tx.productVariant.upsert({
          where: { supplierId_unitOfMeasure_ref: { supplierId, unitOfMeasure: variant.unitOfMeasure, ref: variant.ref } },
          create: {
            supplierId,
            unitOfMeasure: variant.unitOfMeasure,
            ref: variant.ref,
            targetUnitOfMeasure: main.unitOfMeasure,
            targetRef: main.ref,
            createdById: userId,
          },
          update: { targetUnitOfMeasure: main.unitOfMeasure, targetRef: main.ref, createdById: userId, createdAt: new Date() },
        });
      }

      return main;
    });
  }

  async unmergeVariant(supplierId: number, variant: ProductRef): Promise<boolean> {
    const { count } = await prisma.productVariant.deleteMany({
      where: { supplierId, unitOfMeasure: variant.unitOfMeasure, ref: variant.ref },
    });
    return count > 0;
  }

  async getDismissedSuggestions(): Promise<{ supplierId: number; signature: string }[]> {
    return prisma.productSuggestionDismissal.findMany({ select: { supplierId: true, signature: true } });
  }

  async dismissSuggestion(supplierId: number, signature: string, userId: number): Promise<void> {
    await prisma.productSuggestionDismissal.upsert({
      where: { supplierId_signature: { supplierId, signature } },
      create: { supplierId, signature, createdById: userId },
      update: {},
    });
  }
}
