import { ProductSupplierFilterDto } from '../../dtos';
import { PurchaseProductRepository } from '../../repositories';
import { ProductMerge, ProductVariantRow } from '../../interfaces/purchase-product.interface';
import { ProductKeyHelper } from '../../helpers/product-price.helper';
import { getProductSummariesWithSupplier } from './product-summaries';

export interface GetProductMergesUseCase {
  execute(dto: ProductSupplierFilterDto): Promise<ProductMerge[]>;
}

// Uniones guardadas, agrupadas por producto principal, de la más reciente a la más antigua
export class GetProductMerges implements GetProductMergesUseCase {
  constructor(private readonly repository: PurchaseProductRepository) {}

  async execute(dto: ProductSupplierFilterDto): Promise<ProductMerge[]> {
    const variants = await this.repository.getVariants(dto.supplierId);

    const bySupplier = new Map<number, ProductVariantRow[]>();
    for (const v of variants) bySupplier.set(v.supplierId, [...(bySupplier.get(v.supplierId) ?? []), v]);

    const merges: ProductMerge[] = [];
    for (const [supplierId, links] of bySupplier) {
      // Cada producto (principal o variante) por separado, con todo su historial
      const refs = links.flatMap((v) => [
        { unitOfMeasure: v.unitOfMeasure, ref: v.ref },
        { unitOfMeasure: v.targetUnitOfMeasure, ref: v.targetRef },
      ]);
      const { supplierName, summaries } = await getProductSummariesWithSupplier(this.repository, supplierId, refs);
      const summaryOf = (unitOfMeasure: number, ref: string) => {
        const key = ProductKeyHelper.build(supplierId, unitOfMeasure, ref);
        return summaries.get(key) ?? { key, ref, name: ref, unitOfMeasure, purchases: 0, firstDate: '', lastDate: '', lastPrice: 0 };
      };

      const byTarget = new Map<string, ProductVariantRow[]>();
      for (const v of links) {
        const key = ProductKeyHelper.build(supplierId, v.targetUnitOfMeasure, v.targetRef);
        byTarget.set(key, [...(byTarget.get(key) ?? []), v]);
      }

      for (const group of byTarget.values()) {
        const first = group[0]!;
        merges.push({
          supplierId,
          supplierName,
          product: summaryOf(first.targetUnitOfMeasure, first.targetRef),
          variants: group.map((v) => ({ ...summaryOf(v.unitOfMeasure, v.ref), createdAt: v.createdAt, createdBy: v.createdBy })),
        });
      }
    }

    return merges.sort((a, b) => latest(b) - latest(a));
  }
}

const latest = (merge: ProductMerge) => Math.max(...merge.variants.map((v) => v.createdAt.getTime()));
