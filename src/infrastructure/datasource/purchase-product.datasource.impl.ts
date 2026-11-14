import { prisma } from '../../data/postgres';
import { ProductPriceFilters, ProductPricePointRow, PurchaseProductDatasource } from '../../domain';

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

// Cómo se identifica un producto en las líneas del DTE (detalle y ejemplos en docs/productos-api.md):
// 1. Con código propio: el código en mayúsculas.
// 2. Código dentro de la descripción (Avícola Salvadoreña): "25003131|PLU:|ALIMIAU ADULTO 420 g|..." o el formato
//    anterior "43002523 |  | SALCHICHA ... | 10." → código = 1er campo, nombre = 3er campo (o el 2º si el 3º viene vacío).
// 3. Sin código: el texto antes del primer '|' (Hernández agrega a veces el código de barras después), en mayúsculas
//    y con espacios normalizados.
// El precio sale del precio de lista menos el descuento de la línea (cantidad × precio − descuento), no del monto:
// el monto viene redondeado a centavos y en cantidades chicas mueve el precio unitario.
export class PurchaseProductDatasourceImpl implements PurchaseProductDatasource {
  async getPricePoints(filters: ProductPriceFilters): Promise<ProductPricePointRow[]> {
    const { from, to, supplierId, product } = filters;
    const unitOfMeasure = product?.unitOfMeasure ?? null;
    const ref = product?.ref ?? null;

    const rows = await prisma.$queryRaw<RawPricePointRow[]>`
      WITH lines AS (
        SELECT
          d."supplierId" AS supplier_id,
          i."unitOfMeasure" AS unit,
          CASE
            WHEN nullif(btrim(i."code"), '') IS NOT NULL AND btrim(i."code") <> 'PLU:' THEN upper(btrim(i."code"))
            WHEN i."description" ~ '^\\s*\\d{6,}\\s*\\|' THEN btrim(split_part(i."description", '|', 1))
            ELSE upper(regexp_replace(btrim(split_part(i."description", '|', 1)), '\\s+', ' ', 'g'))
          END AS ref,
          CASE
            WHEN nullif(btrim(i."code"), '') IS NOT NULL AND btrim(i."code") <> 'PLU:' THEN btrim(i."description")
            WHEN i."description" ~ '^\\s*\\d{6,}\\s*\\|' THEN coalesce(
              nullif(btrim(split_part(i."description", '|', 3)), ''),
              btrim(split_part(i."description", '|', 2))
            )
            ELSE btrim(split_part(i."description", '|', 1))
          END AS name,
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
          AND i."quantity" > 0
          -- Bonificaciones: las rotuladas "(BONIFICACIÓN)", las de monto 0 y las facturadas a $0.01
          -- (Sello de Oro regala producto a un centavo con el mismo código que la venta normal)
          AND i."unitPrice" > ${MAX_BONUS_UNIT_PRICE}::numeric
          AND i."taxedSale" + i."exemptSale" + i."nonSubjectSale" > 0
          AND i."description" NOT ILIKE '(BONIFICACI%'
      )
      SELECT
        l.supplier_id AS "supplierId",
        s."name" AS "supplierName",
        l.unit AS "unitOfMeasure",
        l.ref AS "ref",
        max(l.name) AS "name",
        l.document_id AS "documentId",
        l.control_number AS "controlNumber",
        to_char(l.issue_date, 'YYYY-MM-DD') AS "issueDate",
        sum(l.quantity)::float8 AS "quantity",
        sum(l.amount)::float8 AS "amount",
        sum(l.net_amount)::float8 AS "netAmount"
      FROM lines l
      JOIN "Supplier" s ON s."id" = l.supplier_id
      WHERE (${unitOfMeasure}::int IS NULL OR l.unit = ${unitOfMeasure}::int)
        AND (${ref}::text IS NULL OR l.ref = ${ref}::text)
      GROUP BY l.supplier_id, s."name", l.unit, l.ref, l.document_id, l.control_number, l.issue_date
      ORDER BY l.issue_date, l.document_id
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
}
