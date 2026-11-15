import { ProductPriceFilters, ProductRef } from '../datasources/purchase-product.datasource';
import { ProductPricePointRow, ProductReturnRow, ProductVariantRow } from '../interfaces/purchase-product.interface';

export abstract class PurchaseProductRepository {
  abstract getPricePoints(filters: ProductPriceFilters): Promise<ProductPricePointRow[]>;
  abstract getReturns(filters: ProductPriceFilters): Promise<ProductReturnRow[]>;
  abstract getVariants(supplierId: number | null): Promise<ProductVariantRow[]>;
  abstract mergeProducts(supplierId: number, target: ProductRef, variants: ProductRef[], userId: number): Promise<ProductRef>;
  abstract unmergeVariant(supplierId: number, variant: ProductRef): Promise<boolean>;
  abstract getDismissedSuggestions(): Promise<{ supplierId: number; signature: string }[]>;
  abstract dismissSuggestion(supplierId: number, signature: string, userId: number): Promise<void>;
}
