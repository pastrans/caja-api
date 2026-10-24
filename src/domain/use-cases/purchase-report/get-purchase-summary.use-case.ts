import { PurchaseReportDto } from '../../dtos';
import { PurchaseReportRepository } from '../../repositories';
import { PurchaseSummary } from '../../interfaces/purchase.interface';
import { PurchaseTotalsHelper } from '../../helpers/purchase-totals.helper';

export interface GetPurchaseSummaryUseCase {
  execute(dto: PurchaseReportDto): Promise<PurchaseSummary>;
}

export class GetPurchaseSummary implements GetPurchaseSummaryUseCase {
  constructor(private readonly repository: PurchaseReportRepository) {}

  async execute(dto: PurchaseReportDto): Promise<PurchaseSummary> {
    const rows = await this.repository.getTotals(dto);

    return {
      from: dto.from,
      to: dto.to,
      receiverNrc: dto.receiverNrc,
      ...PurchaseTotalsHelper.breakdown(rows),
    };
  }
}
