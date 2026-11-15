import {
  ProductPriceFilters,
  ProductPricePointRow,
  ProductRef,
  ProductReturnRow,
  ProductVariantRow,
  PurchaseProductDatasource,
  PurchaseProductRepository,
} from '../../domain';

export class PurchaseProductRepositoryImpl implements PurchaseProductRepository {
  constructor(private readonly datasource: PurchaseProductDatasource) {}

  getPricePoints(filters: ProductPriceFilters): Promise<ProductPricePointRow[]> {
    return this.datasource.getPricePoints(filters);
  }

  getReturns(filters: ProductPriceFilters): Promise<ProductReturnRow[]> {
    return this.datasource.getReturns(filters);
  }

  getVariants(supplierId: number | null): Promise<ProductVariantRow[]> {
    return this.datasource.getVariants(supplierId);
  }

  mergeProducts(supplierId: number, target: ProductRef, variants: ProductRef[], userId: number): Promise<ProductRef> {
    return this.datasource.mergeProducts(supplierId, target, variants, userId);
  }

  unmergeVariant(supplierId: number, variant: ProductRef): Promise<boolean> {
    return this.datasource.unmergeVariant(supplierId, variant);
  }

  getDismissedSuggestions(): Promise<{ supplierId: number; signature: string }[]> {
    return this.datasource.getDismissedSuggestions();
  }

  dismissSuggestion(supplierId: number, signature: string, userId: number): Promise<void> {
    return this.datasource.dismissSuggestion(supplierId, signature, userId);
  }
}
