import { PurchaseReportDto, PurchaseYearReportDto } from '../dtos';
import { SupplierPurchaseTotalsRow } from '../datasources/purchase-report.datasource';
import { PurchaseTotalsRow } from '../interfaces/purchase.interface';

export abstract class PurchaseReportRepository {
  abstract getTotalsByMonth(dto: PurchaseYearReportDto): Promise<PurchaseTotalsRow[]>;
  abstract getTotals(dto: PurchaseReportDto): Promise<PurchaseTotalsRow[]>;
  abstract getTotalsBySupplier(dto: PurchaseReportDto): Promise<SupplierPurchaseTotalsRow[]>;
}
