import { SalesPeriodSummary, SalesTotals } from '../interfaces/dashboard.interface';

export class SalesCalculatorHelper {
  static round(value: number): number {
    return Number(value.toFixed(2));
  }

  // Ticket promedio = total vendido / número de ventas
  static averageTicket({ total, count }: SalesTotals): number {
    return count > 0 ? this.round(total / count) : 0;
  }

  // Porcentaje que representa una parte del total
  static percentage(part: number, total: number): number {
    return total > 0 ? this.round((part / total) * 100) : 0;
  }

  static withAverage(totals: SalesTotals): SalesPeriodSummary {
    return { ...totals, averageTicket: this.averageTicket(totals) };
  }

  static sum(items: SalesTotals[]): SalesTotals {
    const totals = items.reduce(
      (acc, item) => ({ total: acc.total + item.total, count: acc.count + item.count }),
      { total: 0, count: 0 }
    );
    return { total: this.round(totals.total), count: totals.count };
  }
}
