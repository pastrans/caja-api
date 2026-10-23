import { SalesReportDto } from '../../dtos';
import { DashboardRepository } from '../../repositories';
import { SalesOverTime } from '../../interfaces/dashboard.interface';
import { SalesCalculatorHelper } from '../../helpers/sales-calculator.helper';

export interface GetSalesOverTimeUseCase {
  execute(dto: SalesReportDto): Promise<SalesOverTime>;
}

export class GetSalesOverTime implements GetSalesOverTimeUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(dto: SalesReportDto): Promise<SalesOverTime> {
    const data = await this.repository.getSalesOverTime(dto);
    const { total, count } = SalesCalculatorHelper.sum(data);

    return {
      from: dto.from,
      to: dto.to,
      groupBy: dto.groupBy,
      employeeIds: dto.employeeIds,
      total,
      count,
      data,
    };
  }
}
