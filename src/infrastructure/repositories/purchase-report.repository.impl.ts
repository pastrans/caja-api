import {
  PurchaseReportRepository,
  PurchaseReportDatasource,
  PurchaseReportDto,
  PurchaseTotalsRow,
  PurchaseYearReportDto,
  SupplierPurchaseTotalsRow,
} from '../../domain';

export class PurchaseReportRepositoryImpl implements PurchaseReportRepository {
  constructor(private readonly datasource: PurchaseReportDatasource) {}

  getTotalsByMonth(dto: PurchaseYearReportDto): Promise<PurchaseTotalsRow[]> {
    return this.datasource.getTotalsByMonth(dto);
  }

  getTotals(dto: PurchaseReportDto): Promise<PurchaseTotalsRow[]> {
    return this.datasource.getTotals(dto);
  }

  getTotalsBySupplier(dto: PurchaseReportDto): Promise<SupplierPurchaseTotalsRow[]> {
    return this.datasource.getTotalsBySupplier(dto);
  }
}
