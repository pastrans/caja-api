import { PurchaseReportDto, PurchaseYearReportDto } from '../dtos';
import { PurchaseTotalsRow } from '../interfaces/purchase.interface';

export interface SupplierPurchaseTotalsRow extends PurchaseTotalsRow {
  name: string;
  nit: string;
}

// Totales de documentos activos (los anulados no cuentan), agrupados además por tipo de documento
export abstract class PurchaseReportDatasource {
  abstract getTotalsByMonth(dto: PurchaseYearReportDto): Promise<PurchaseTotalsRow[]>; // key: YYYY-MM
  abstract getTotals(dto: PurchaseReportDto): Promise<PurchaseTotalsRow[]>; // una fila por tipo
  abstract getTotalsBySupplier(dto: PurchaseReportDto): Promise<SupplierPurchaseTotalsRow[]>; // key: supplierId
}
