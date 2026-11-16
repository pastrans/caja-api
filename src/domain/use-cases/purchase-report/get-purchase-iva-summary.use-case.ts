import { PurchaseYearReportDto } from '../../dtos';
import { PurchaseReportRepository } from '../../repositories';
import { PurchaseIvaSummary } from '../../interfaces/purchase.interface';
import { PurchaseTotalsHelper } from '../../helpers/purchase-totals.helper';

export interface GetPurchaseIvaSummaryUseCase {
  execute(dto: PurchaseYearReportDto): Promise<PurchaseIvaSummary>;
}

// Los 12 meses del año, incluidos los meses sin compras (en cero)
export class GetPurchaseIvaSummary implements GetPurchaseIvaSummaryUseCase {
  constructor(private readonly repository: PurchaseReportRepository) {}

  async execute(dto: PurchaseYearReportDto): Promise<PurchaseIvaSummary> {
    const rows = await this.repository.getTotalsByMonth(dto);

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = `${dto.year}-${String(index + 1).padStart(2, '0')}`;
      return { month, ...PurchaseTotalsHelper.breakdown(rows.filter((row) => row.key === month)) };
    });

    return {
      year: dto.year,
      receiverNrc: dto.receiverNrc,
      supplierId: dto.supplierId,
      months,
      total: PurchaseTotalsHelper.breakdown(rows),
    };
  }
}
