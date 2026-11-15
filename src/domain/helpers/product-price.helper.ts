import { DateHelper } from './date.helper';
import {
  PriceTrendDirection,
  ProductPriceMonth,
  ProductPricePoint,
  ProductPricePointRow,
  ProductPriceProjection,
  ProductPriceStats,
  ProductPriceTrend,
  ProductReturnRow,
  ProductReturnStatus,
  ProductReturnType,
  ProductSummary,
} from '../interfaces/purchase-product.interface';

const DAYS_PER_MONTH = 30.4375;

// Con menos datos la pendiente es ruido: se reporta "sin datos suficientes"
const MIN_TREND_POINTS = 4;
const MIN_TREND_DAYS = 60;

// Variación mensual por debajo de la cual el precio se considera estable
const FLAT_THRESHOLD_PCT = 0.5;

const PROJECTION_MONTHS = 3;

const QUANTITY_EPSILON = 0.0001;

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor || 0; // || 0 evita -0
};

const pct = (from: number, to: number) => (from > 0 ? round(((to - from) / from) * 100, 2) : 0);

// Identificador del producto: proveedor + unidad de medida + código. El código puede traer ':' (descripciones)
export class ProductKeyHelper {
  static build(supplierId: number, unitOfMeasure: number, ref: string): string {
    return `${supplierId}:${unitOfMeasure}:${ref}`;
  }

  static parse(key: unknown): { supplierId: number; unitOfMeasure: number; ref: string } | null {
    if (typeof key !== 'string') return null;
    const match = /^(\d+):(\d+):(.+)$/.exec(key);
    if (!match) return null;
    return { supplierId: Number(match[1]), unitOfMeasure: Number(match[2]), ref: match[3]! };
  }

  // Clave sin proveedor ("unidad:código"), para filtrar productos de un proveedor ya conocido
  static localKey(unitOfMeasure: number, ref: string): string {
    return `${unitOfMeasure}:${ref}`;
  }
}

// Agrupa nombres que suelen ser el mismo producto escrito distinto (Hernández cambió "454 G" por "454 g 8U").
// Es solo una sugerencia: el usuario confirma antes de unir
export class ProductNameHelper {
  static signature(name: string): string {
    return name
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/\bDESCUENTO\b/g, ' ')                               // "... 6U Descuento"
      .replace(/\b\d+\s*U\b/g, ' ')                                 // empaque: 8U, 24U, "10 U"
      .replace(/(\d+(?:\.\d+)?)\s*(GRAMOS|GRS|GR|G)\b/g, '$1')      // "454 G", "200 GRS", "325 GRAMOS" → número
      .replace(/[^A-Z0-9.]+/g, ' ')
      .trim();
  }
}

export class ProductPriceHelper {
  // Precio pagado por unidad (con descuento y rebajas, sin IVA). Sale del precio de lista y no del monto, que viene
  // redondeado. Las devoluciones al mismo precio no lo cambian
  static unitPrice(row: Pick<ProductPricePointRow, 'netAmount' | 'quantity' | 'priceAdjustment'>): number {
    return (row.netAmount - (row.priceAdjustment ?? 0)) / row.quantity;
  }

  // Cantidad y gasto que quedaron después de las notas de crédito
  static netQuantity(row: ProductPricePointRow): number {
    return Math.max(row.quantity - (row.returnedQuantity ?? 0), 0);
  }

  static netSpent(row: ProductPricePointRow): number {
    return Math.max(row.amount - (row.returnedAmount ?? 0), 0);
  }

  // Agrupa los puntos por producto, ordenados por fecha
  static groupByProduct(rows: ProductPricePointRow[]): Map<string, ProductPricePointRow[]> {
    const groups = new Map<string, ProductPricePointRow[]>();
    for (const row of rows) {
      const key = ProductKeyHelper.build(row.supplierId, row.unitOfMeasure, row.ref);
      const group = groups.get(key);
      if (group) group.push(row);
      else groups.set(key, [row]);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.issueDate.localeCompare(b.issueDate) || a.documentId - b.documentId);
    }
    return groups;
  }

  // rows: puntos de un solo producto ordenados por fecha
  static stats(rows: ProductPricePointRow[]): ProductPriceStats {
    const first = rows[0]!;
    const last = rows[rows.length - 1]!;
    const previous = rows.length > 1 ? rows[rows.length - 2]! : null;
    const prices = rows.map((row) => this.unitPrice(row));

    const purchasedQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
    const quantity = rows.reduce((sum, row) => sum + this.netQuantity(row), 0);
    const spent = rows.reduce((sum, row) => sum + this.netSpent(row), 0);
    const paid = rows.reduce((sum, row) => sum + row.netAmount - (row.priceAdjustment ?? 0), 0);
    const firstPrice = prices[0]!;
    const lastPrice = prices[prices.length - 1]!;
    const previousPrice = previous ? this.unitPrice(previous) : null;

    return {
      key: ProductKeyHelper.build(last.supplierId, last.unitOfMeasure, last.ref),
      supplierId: last.supplierId,
      supplierName: last.supplierName,
      ref: last.ref,
      name: last.name, // El nombre más reciente
      unitOfMeasure: last.unitOfMeasure,
      purchases: rows.length,
      quantity: round(quantity, 4),
      spent: round(spent, 2),
      returnedQuantity: round(rows.reduce((sum, row) => sum + (row.returnedQuantity ?? 0), 0), 4),
      returnedAmount: round(rows.reduce((sum, row) => sum + (row.returnedAmount ?? 0), 0), 2),
      returns: rows.reduce((sum, row) => sum + (row.returns?.length ?? 0), 0),
      avgPrice: round(paid / purchasedQuantity, 4), // Promedio ponderado por la cantidad comprada
      minPrice: round(Math.min(...prices), 4),
      maxPrice: round(Math.max(...prices), 4),
      firstDate: first.issueDate,
      firstPrice: round(firstPrice, 4),
      lastDate: last.issueDate,
      lastPrice: round(lastPrice, 4),
      previousPrice: previousPrice === null ? null : round(previousPrice, 4),
      changePct: pct(firstPrice, lastPrice),
      lastChangePct: previousPrice === null ? null : pct(previousPrice, lastPrice),
      trend: this.trend(rows),
      variants: 0, // Lo completa el caso de uso con las variantes guardadas
    };
  }

  // Resumen corto de un producto (para variantes y sugerencias); rows ordenados por fecha
  static summary(rows: ProductPricePointRow[]): ProductSummary {
    const first = rows[0]!;
    const last = rows[rows.length - 1]!;
    return {
      key: ProductKeyHelper.build(last.supplierId, last.unitOfMeasure, last.ref),
      ref: last.ref,
      name: last.name,
      unitOfMeasure: last.unitOfMeasure,
      purchases: rows.length,
      firstDate: first.issueDate,
      lastDate: last.issueDate,
      lastPrice: round(this.unitPrice(last), 4),
    };
  }

  // Regresión lineal del precio de cada compra contra el tiempo (días desde la primera compra)
  static trend(rows: ProductPricePointRow[]): ProductPriceTrend | null {
    if (rows.length < MIN_TREND_POINTS) return null;

    const firstDate = rows[0]!.issueDate;
    const span = DateHelper.daysBetween(firstDate, rows[rows.length - 1]!.issueDate);
    if (span < MIN_TREND_DAYS) return null;

    const xs = rows.map((row) => DateHelper.daysBetween(firstDate, row.issueDate));
    const ys = rows.map((row) => this.unitPrice(row));
    const n = xs.length;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    let sxx = 0;
    let sxy = 0;
    let syy = 0;
    for (let i = 0; i < n; i++) {
      sxx += (xs[i]! - meanX) ** 2;
      sxy += (xs[i]! - meanX) * (ys[i]! - meanY);
      syy += (ys[i]! - meanY) ** 2;
    }

    const slope = sxx > 0 ? sxy / sxx : 0;
    const intercept = meanY - slope * meanX;
    // Precio constante: la línea es exacta aunque no "explique" variación
    const r2 = syy > 0 ? (sxy * sxy) / (sxx * syy) : 1;
    const pctPerMonth = meanY > 0 ? ((slope * DAYS_PER_MONTH) / meanY) * 100 : 0;

    let direction: PriceTrendDirection = 'flat';
    if (pctPerMonth >= FLAT_THRESHOLD_PCT) direction = 'up';
    else if (pctPerMonth <= -FLAT_THRESHOLD_PCT) direction = 'down';

    return {
      pctPerMonth: round(pctPerMonth, 2),
      slopePerMonth: round(slope * DAYS_PER_MONTH, 4),
      r2: round(r2, 2),
      direction,
      startPrice: round(intercept, 4),
      endPrice: round(intercept + slope * span, 4),
    };
  }

  // Precio estimado si la tendencia sigue igual: 1, 2 y 3 meses después de la última compra
  static projection(rows: ProductPricePointRow[], trend: ProductPriceTrend | null): ProductPriceProjection[] {
    if (!trend) return [];
    const lastDate = rows[rows.length - 1]!.issueDate;
    const slopePerDay = trend.slopePerMonth / DAYS_PER_MONTH;

    return Array.from({ length: PROJECTION_MONTHS }, (_, i) => {
      const days = Math.round((i + 1) * DAYS_PER_MONTH);
      return {
        date: DateHelper.addDays(lastDate, days),
        price: round(Math.max(trend.endPrice + slopePerDay * days, 0), 4),
      };
    });
  }

  static points(rows: ProductPricePointRow[]): ProductPricePoint[] {
    return rows.map((row) => {
      const returnedQuantity = row.returnedQuantity ?? 0;
      let returnStatus: ProductReturnStatus = 'none';
      if (returnedQuantity > 0) returnStatus = returnedQuantity >= row.quantity - QUANTITY_EPSILON ? 'total' : 'partial';
      else if ((row.returns?.length ?? 0) > 0) returnStatus = 'partial'; // Solo rebajas de precio

      return {
        date: row.issueDate,
        documentId: row.documentId,
        controlNumber: row.controlNumber,
        quantity: round(row.quantity, 4),
        amount: round(row.amount, 2),
        unitPrice: round(this.unitPrice(row), 4),
        returnStatus,
        returnedQuantity: round(returnedQuantity, 4),
        returnedAmount: round(row.returnedAmount ?? 0, 2),
        returns: row.returns ?? [],
      };
    });
  }

  static months(rows: ProductPricePointRow[]): ProductPriceMonth[] {
    const byMonth = new Map<string, ProductPricePointRow[]>();
    for (const row of rows) {
      const month = row.issueDate.slice(0, 7);
      const group = byMonth.get(month);
      if (group) group.push(row);
      else byMonth.set(month, [row]);
    }

    return [...byMonth.entries()].map(([month, group]) => {
      const purchasedQuantity = group.reduce((sum, row) => sum + row.quantity, 0);
      const paid = group.reduce((sum, row) => sum + row.netAmount - (row.priceAdjustment ?? 0), 0);
      const prices = group.map((row) => this.unitPrice(row));
      return {
        month,
        purchases: group.length,
        quantity: round(group.reduce((sum, row) => sum + this.netQuantity(row), 0), 4),
        spent: round(group.reduce((sum, row) => sum + this.netSpent(row), 0), 2),
        returnedAmount: round(group.reduce((sum, row) => sum + (row.returnedAmount ?? 0), 0), 2),
        avgPrice: round(paid / purchasedQuantity, 4), // Promedio ponderado por la cantidad comprada
        minPrice: round(Math.min(...prices), 4),
        maxPrice: round(Math.max(...prices), 4),
      };
    });
  }
}

// Las notas de crédito sobre una compra: una devolución al mismo precio no cambia el precio por unidad (solo la
// cantidad y el gasto); una rebaja (misma cantidad, precio menor) sí lo baja. Detalle en docs/productos-api.md
export class ProductReturnHelper {
  // Mismo precio con margen de redondeo: 0.1 % o $0.001
  static type(row: ProductReturnRow): ProductReturnType {
    const samePrice = Math.abs(row.listPrice - row.purchaseListPrice) <= Math.max(0.001, row.purchaseListPrice * 0.001);
    const sameQuantity = Math.abs(row.quantity - row.purchaseQuantity) < QUANTITY_EPSILON;
    return !samePrice && sameQuantity && row.listPrice < row.purchaseListPrice ? 'price' : 'return';
  }

  // Suma las notas de crédito a la compra (punto) que modifican; points y returns ya vienen con el producto principal
  static attach(points: ProductPricePointRow[], returns: ProductReturnRow[]): ProductPricePointRow[] {
    const byPurchase = new Map<string, ProductReturnRow[]>();
    for (const row of returns) {
      const key = `${ProductKeyHelper.build(row.supplierId, row.unitOfMeasure, row.ref)}|${row.purchaseDocumentId}`;
      byPurchase.set(key, [...(byPurchase.get(key) ?? []), row]);
    }

    return points.map((point) => {
      const rows = byPurchase.get(`${ProductKeyHelper.build(point.supplierId, point.unitOfMeasure, point.ref)}|${point.documentId}`);
      if (!rows) return point;

      let returnedQuantity = 0;
      let returnedAmount = 0;
      let priceAdjustment = 0;
      const sorted = [...rows].sort((a, b) => a.issueDate.localeCompare(b.issueDate) || a.documentId - b.documentId);
      const list = sorted.map((row) => {
        const type = this.type(row);
        if (type === 'price') priceAdjustment += row.netAmount;
        else returnedQuantity += row.quantity;
        returnedAmount += row.amount;
        return {
          date: row.issueDate,
          documentId: row.documentId,
          controlNumber: row.controlNumber,
          type,
          quantity: round(row.quantity, 4),
          amount: round(row.amount, 2),
        };
      });

      return {
        ...point,
        returns: list,
        // Algunas notas devuelven más de lo comprado en esa línea: se limita a lo comprado
        returnedQuantity: Math.min(returnedQuantity, point.quantity),
        returnedAmount: Math.min(returnedAmount, point.amount),
        priceAdjustment: Math.min(priceAdjustment, point.netAmount),
      };
    });
  }
}
