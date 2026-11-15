import { PurchaseProductHistoryDto } from '../../dtos';
import { PurchaseProductRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';
import {
  ProductPriceMonth,
  ProductPricePoint,
  ProductPriceProjection,
  ProductPriceStats,
  ProductVariantInfo,
} from '../../interfaces/purchase-product.interface';
import { ProductKeyHelper, ProductPriceHelper, ProductReturnHelper } from '../../helpers/product-price.helper';
import { getProductSummaries } from './product-summaries';

export interface PurchaseProductHistory {
  months: number | null;
  from: string;
  to: string;
  product: ProductPriceStats;           // Si se pidió una variante, es su producto principal
  variants: ProductVariantInfo[];       // Variantes unidas (con su historial completo, no solo el del periodo)
  points: ProductPricePoint[];          // Una compra por documento, de la más antigua a la más reciente
  monthly: ProductPriceMonth[];         // Solo los meses con compras
  projection: ProductPriceProjection[]; // Vacío si no hay tendencia
}

export interface GetPurchaseProductHistoryUseCase {
  execute(dto: PurchaseProductHistoryDto): Promise<PurchaseProductHistory>;
}

export class GetPurchaseProductHistory implements GetPurchaseProductHistoryUseCase {
  constructor(private readonly repository: PurchaseProductRepository) {}

  async execute(dto: PurchaseProductHistoryDto): Promise<PurchaseProductHistory> {
    const supplierVariants = await this.repository.getVariants(dto.supplierId);

    // Una variante se muestra como su producto principal
    const link = supplierVariants.find((v) => v.unitOfMeasure === dto.unitOfMeasure && v.ref === dto.ref);
    const main = link
      ? { unitOfMeasure: link.targetUnitOfMeasure, ref: link.targetRef }
      : { unitOfMeasure: dto.unitOfMeasure, ref: dto.ref };

    const filters = { from: dto.from, to: dto.to, supplierId: dto.supplierId, products: [main], resolveVariants: true };
    const [points, returns] = await Promise.all([this.repository.getPricePoints(filters), this.repository.getReturns(filters)]);
    const rows = ProductReturnHelper.attach(points, returns);

    if (rows.length === 0) throw CustomError.notFound('No purchases of this product in the selected period');

    const variants = supplierVariants.filter((v) => v.targetUnitOfMeasure === main.unitOfMeasure && v.targetRef === main.ref);
    const summaries = await getProductSummaries(this.repository, dto.supplierId, variants);

    const product = { ...ProductPriceHelper.stats(rows), variants: variants.length };

    return {
      months: dto.months,
      from: dto.from,
      to: dto.to,
      product,
      variants: variants.map((v) => {
        const key = ProductKeyHelper.build(v.supplierId, v.unitOfMeasure, v.ref);
        const summary = summaries.get(key);
        return {
          key,
          ref: v.ref,
          name: summary?.name ?? v.ref,
          unitOfMeasure: v.unitOfMeasure,
          purchases: summary?.purchases ?? 0,
          firstDate: summary?.firstDate ?? '',
          lastDate: summary?.lastDate ?? '',
          lastPrice: summary?.lastPrice ?? 0,
          createdAt: v.createdAt,
          createdBy: v.createdBy,
        };
      }),
      points: ProductPriceHelper.points(rows),
      monthly: ProductPriceHelper.months(rows),
      projection: ProductPriceHelper.projection(rows, product.trend),
    };
  }
}
