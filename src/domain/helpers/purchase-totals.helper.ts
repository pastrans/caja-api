import { SalesCalculatorHelper } from './sales-calculator.helper';
import {
  PurchaseAmounts,
  PurchaseNetTotals,
  PurchaseTotals,
  PurchaseTotalsBreakdown,
  PurchaseTotalsRow,
} from '../interfaces/purchase.interface';

const AMOUNT_KEYS: (keyof PurchaseAmounts)[] = ['taxed', 'exempt', 'nonSubject', 'iva', 'ivaPerceived', 'ivaWithheld', 'total'];

export class PurchaseTotalsHelper {
  static empty(): PurchaseTotals {
    return { documents: 0, taxed: 0, exempt: 0, nonSubject: 0, iva: 0, ivaPerceived: 0, ivaWithheld: 0, total: 0 };
  }

  // Suma las filas por tipo; el neto es créditos fiscales menos notas de crédito
  static breakdown(rows: PurchaseTotalsRow[]): PurchaseTotalsBreakdown {
    const creditosFiscales = this.sum(rows.filter((row) => row.type === 'CREDITO_FISCAL'));
    const notasCredito = this.sum(rows.filter((row) => row.type === 'NOTA_CREDITO'));

    const net = {} as PurchaseNetTotals;
    for (const key of AMOUNT_KEYS) {
      net[key] = SalesCalculatorHelper.round(creditosFiscales[key] - notasCredito[key]);
    }
    net.ivaCredit = SalesCalculatorHelper.round(net.iva + net.ivaPerceived);

    return { creditosFiscales, notasCredito, net };
  }

  private static sum(rows: PurchaseTotals[]): PurchaseTotals {
    const totals = this.empty();
    for (const row of rows) {
      totals.documents += row.documents;
      for (const key of AMOUNT_KEYS) {
        totals[key] = SalesCalculatorHelper.round(totals[key] + row[key]);
      }
    }
    return totals;
  }
}
