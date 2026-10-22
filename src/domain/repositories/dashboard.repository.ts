import { SalesReportDto } from '../dtos';
import { EmployeeSalesRaw, SalesSummaryRaw, SalesTimePoint } from '../interfaces/dashboard.interface';

export abstract class DashboardRepository {
  abstract getSalesSummary(): Promise<SalesSummaryRaw>;
  abstract getSalesByEmployee(dto: SalesReportDto): Promise<EmployeeSalesRaw[]>;
  abstract getSalesOverTime(dto: SalesReportDto): Promise<SalesTimePoint[]>;
}
