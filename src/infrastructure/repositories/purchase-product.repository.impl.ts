import { ProductPriceFilters, ProductPricePointRow, PurchaseProductDatasource, PurchaseProductRepository } from '../../domain';

export class PurchaseProductRepositoryImpl implements PurchaseProductRepository {
  constructor(private readonly datasource: PurchaseProductDatasource) {}

  getPricePoints(filters: ProductPriceFilters): Promise<ProductPricePointRow[]> {
    return this.datasource.getPricePoints(filters);
  }
}
