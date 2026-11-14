// Análisis de precios de los productos comprados (líneas de los créditos fiscales)

// Un precio por producto y documento: si el producto viene en varias líneas del mismo DTE se promedian
export interface ProductPricePointRow {
  supplierId: number;
  supplierName: string;
  unitOfMeasure: number;
  ref: string; // Código del producto (o descripción normalizada si el proveedor no manda código)
  name: string;
  documentId: number;
  controlNumber: string;
  issueDate: string; // YYYY-MM-DD
  quantity: number;
  amount: number;    // Monto facturado de las líneas (con descuento, sin IVA): es lo que se gastó
  netAmount: number; // Cantidad × precio de lista − descuento, sin redondear: de aquí sale el precio unitario
}

export type PriceTrendDirection = 'up' | 'down' | 'flat';

export interface ProductPriceTrend {
  pctPerMonth: number;    // Pendiente de la regresión como % del precio promedio, por mes
  slopePerMonth: number;  // Pendiente en dólares por mes
  r2: number;             // 0-1: qué tanto se ajustan los precios a la línea
  direction: PriceTrendDirection;
  startPrice: number;     // Valor de la línea en la primera compra
  endPrice: number;       // Valor de la línea en la última compra
}

export interface ProductPriceStats {
  key: string;
  supplierId: number;
  supplierName: string;
  ref: string;
  name: string;
  unitOfMeasure: number;
  purchases: number;
  quantity: number;
  spent: number;
  avgPrice: number; // Promedio ponderado por cantidad
  minPrice: number;
  maxPrice: number;
  firstDate: string;
  firstPrice: number;
  lastDate: string;
  lastPrice: number;
  previousPrice: number | null; // Compra anterior a la última
  changePct: number;            // Última vs. primera compra del periodo
  lastChangePct: number | null; // Última vs. anterior
  trend: ProductPriceTrend | null; // null si no hay datos suficientes
}

export interface ProductPricePoint {
  date: string;
  documentId: number;
  controlNumber: string;
  quantity: number;
  amount: number;
  unitPrice: number;
}

export interface ProductPriceMonth {
  month: string; // YYYY-MM
  purchases: number;
  quantity: number;
  spent: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface ProductPriceProjection {
  date: string; // YYYY-MM-DD
  price: number;
}

export interface ProductsTrendSummary {
  products: number;
  rising: number;
  falling: number;
  flat: number;
  insufficient: number;
}

export type PurchaseProductSort = 'spent' | 'change' | 'trend' | 'name' | 'recent';
