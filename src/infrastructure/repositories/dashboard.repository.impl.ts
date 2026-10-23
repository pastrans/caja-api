import {
  DashboardDatasource,
  DashboardRepository,
  EmployeeSalesRaw,
  SalesReportDto,
  SalesSummaryRaw,
  SalesTimePoint,
} from '../../domain';

export class DashboardRepositoryImpl implements DashboardRepository {
  constructor(private readonly datasource: DashboardDatasource) {}

  getSalesSummary(): Promise<SalesSummaryRaw> {
    return this.datasource.getSalesSummary();
  }

  getSalesByEmployee(dto: SalesReportDto): Promise<EmployeeSalesRaw[]> {
    return this.datasource.getSalesByEmployee(dto);
  }

  getSalesOverTime(dto: SalesReportDto): Promise<SalesTimePoint[]> {
    return this.datasource.getSalesOverTime(dto);
  }
}
