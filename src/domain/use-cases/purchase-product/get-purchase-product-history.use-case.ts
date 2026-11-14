import { PurchaseProductHistoryDto } from '../../dtos';
import { PurchaseProductRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';
import {
  ProductPriceMonth,
  ProductPricePoint,
  ProductPriceProjection,
  ProductPriceStats,
} from '../../interfaces/purchase-product.interface';
import { ProductPriceHelper } from '../../helpers/product-price.helper';

export interface PurchaseProductHistory {
  months: number | null;
  from: string;
  to: string;
  product: ProductPriceStats;
  points: ProductPricePoint[];       // Una compra por documento, de la más antigua a la más reciente
  monthly: ProductPriceMonth[];      // Solo los meses con compras
  projection: ProductPriceProjection[]; // Vacío si no hay tendencia
}

export interface GetPurchaseProductHistoryUseCase {
  execute(dto: PurchaseProductHistoryDto): Promise<PurchaseProductHistory>;
}

export class GetPurchaseProductHistory implements GetPurchaseProductHistoryUseCase {
  constructor(private readonly repository: PurchaseProductRepository) {}

  async execute(dto: PurchaseProductHistoryDto): Promise<PurchaseProductHistory> {
    const rows = await this.repository.getPricePoints({
      from: dto.from,
      to: dto.to,
      supplierId: dto.supplierId,
      product: { unitOfMeasure: dto.unitOfMeasure, ref: dto.ref },
    });

    if (rows.length === 0) throw CustomError.notFound('No purchases of this product in the selected period');

    const product = ProductPriceHelper.stats(rows);

    return {
      months: dto.months,
      from: dto.from,
      to: dto.to,
      product,
      points: ProductPriceHelper.points(rows),
      monthly: ProductPriceHelper.months(rows),
      projection: ProductPriceHelper.projection(rows, product.trend),
    };
  }
}
