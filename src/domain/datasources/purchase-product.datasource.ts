import { ProductPricePointRow, ProductReturnRow, ProductVariantRow } from '../interfaces/purchase-product.interface';

export interface ProductRef {
  unitOfMeasure: number;
  ref: string;
}

export type ReturnDateFilter = 'purchase' | 'return';

export interface ProductPriceFilters {
  from: string;
  to: string;
  supplierId: number | null;
  products: ProductRef[] | null; // Solo los puntos de esos productos (con supplierId)
  resolveVariants: boolean;      // true: las compras de una variante cuentan como del producto principal
}

// Precios de los productos de los créditos fiscales activos. No cuentan las notas de crédito,
// las bonificaciones ni las líneas sin monto (no reflejan el precio de compra)
export abstract class PurchaseProductDatasource {
  abstract getPricePoints(filters: ProductPriceFilters): Promise<ProductPricePointRow[]>;
  // Líneas de notas de crédito activas sobre las compras de getPricePoints (mismos filtros, por la fecha de la compra)
  // dateOf: 'purchase' filtra por la fecha de la compra (análisis de precios); 'return', por la de la nota de crédito
  abstract getReturns(filters: ProductPriceFilters, dateOf?: ReturnDateFilter): Promise<ProductReturnRow[]>;
  // Comprado en el periodo: líneas de créditos fiscales activos, sin IVA
  abstract getPurchasedAmount(from: string, to: string, supplierId: number | null): Promise<number>;
  abstract getVariants(supplierId: number | null): Promise<ProductVariantRow[]>;
  abstract mergeProducts(supplierId: number, target: ProductRef, variants: ProductRef[], userId: number): Promise<ProductRef>;
  abstract unmergeVariant(supplierId: number, variant: ProductRef): Promise<boolean>;
  abstract getDismissedSuggestions(): Promise<{ supplierId: number; signature: string }[]>;
  abstract dismissSuggestion(supplierId: number, signature: string, userId: number): Promise<void>;
}
