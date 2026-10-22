import { SalesReportDto } from '../../dtos';
import { DashboardRepository } from '../../repositories';
import { SalesByEmployee } from '../../interfaces/dashboard.interface';
import { SalesCalculatorHelper } from '../../helpers/sales-calculator.helper';

export interface GetSalesByEmployeeUseCase {
  execute(dto: SalesReportDto): Promise<SalesByEmployee>;
}

export class GetSalesByEmployee implements GetSalesByEmployeeUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(dto: SalesReportDto): Promise<SalesByEmployee> {
    const rows = await this.repository.getSalesByEmployee(dto);
    const { total, count } = SalesCalculatorHelper.sum(rows);

    // Ordenados de mayor a menor venta
    const employees = rows
      .map((row) => ({
        ...row,
        averageTicket: SalesCalculatorHelper.averageTicket(row),
        percentage: SalesCalculatorHelper.percentage(row.total, total),
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

    return { from: dto.from, to: dto.to, total, count, employees };
  }
}
