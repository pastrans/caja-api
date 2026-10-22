import { DashboardRepository } from '../../repositories';
import { SalesSummary } from '../../interfaces/dashboard.interface';
import { SalesCalculatorHelper } from '../../helpers/sales-calculator.helper';

export interface GetSalesSummaryUseCase {
  execute(): Promise<SalesSummary>;
}

export class GetSalesSummary implements GetSalesSummaryUseCase {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly timezone: string,
  ) {}

  async execute(): Promise<SalesSummary> {
    const { today, week, month, year } = await this.repository.getSalesSummary();

    return {
      timezone: this.timezone,
      generatedAt: new Date(),
      today: SalesCalculatorHelper.withAverage(today),
      week: SalesCalculatorHelper.withAverage(week),
      month: SalesCalculatorHelper.withAverage(month),
      year: SalesCalculatorHelper.withAverage(year),
    };
  }
}
