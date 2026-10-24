import { PurchaseReportDto } from '../../dtos';
import { PurchaseReportRepository } from '../../repositories';
import { PurchasesBySupplier, SupplierPurchases } from '../../interfaces/purchase.interface';
import { PurchaseTotalsHelper } from '../../helpers/purchase-totals.helper';
import { SalesCalculatorHelper } from '../../helpers/sales-calculator.helper';

export interface GetPurchasesBySupplierUseCase {
  execute(dto: PurchaseReportDto): Promise<PurchasesBySupplier>;
}

export class GetPurchasesBySupplier implements GetPurchasesBySupplierUseCase {
  constructor(private readonly repository: PurchaseReportRepository) {}

  async execute(dto: PurchaseReportDto): Promise<PurchasesBySupplier> {
    const rows = await this.repository.getTotalsBySupplier(dto);
    const total = PurchaseTotalsHelper.breakdown(rows).net.total;

    // Una entrada por proveedor con sus totales netos (créditos fiscales - notas de crédito)
    const supplierIds = [...new Set(rows.map((row) => row.key))];
    const suppliers: SupplierPurchases[] = supplierIds
      .map((supplierId) => {
        const supplierRows = rows.filter((row) => row.key === supplierId);
        const { creditosFiscales, notasCredito, net } = PurchaseTotalsHelper.breakdown(supplierRows);
        return {
          supplierId: Number(supplierId),
          name: supplierRows[0]!.name,
          nit: supplierRows[0]!.nit,
          creditosFiscales: creditosFiscales.documents,
          notasCredito: notasCredito.documents,
          ...net,
          percentage: SalesCalculatorHelper.percentage(net.total, total),
        };
      })
      // Ordenados de mayor a menor compra
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

    return { from: dto.from, to: dto.to, receiverNrc: dto.receiverNrc, total, suppliers };
  }
}
