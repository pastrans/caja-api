import { ProductPricePointRow } from '../interfaces/purchase-product.interface';

export interface ProductPriceFilters {
  from: string;
  to: string;
  supplierId: number | null;
  product: { unitOfMeasure: number; ref: string } | null; // Solo los puntos de un producto (con supplierId)
}

// Precios de los productos de los créditos fiscales activos. No cuentan las notas de crédito,
// las bonificaciones ni las líneas sin monto (no reflejan el precio de compra)
export abstract class PurchaseProductDatasource {
  abstract getPricePoints(filters: ProductPriceFilters): Promise<ProductPricePointRow[]>;
}
