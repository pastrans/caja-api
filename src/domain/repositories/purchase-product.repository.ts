import { ProductPriceFilters } from '../datasources/purchase-product.datasource';
import { ProductPricePointRow } from '../interfaces/purchase-product.interface';

export abstract class PurchaseProductRepository {
  abstract getPricePoints(filters: ProductPriceFilters): Promise<ProductPricePointRow[]>;
}
