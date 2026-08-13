import { TransactionRecordEntity, CashInOutRecordEntity } from '../entities';

export interface CashRegisterBalance {
  totalTransactions: number;
  totalCashInOut: number;
  totalExpected: number;
  difference: number;
}

export class CashCalculatorHelper {
  // 1. Calcula el total de transacciones realizadas
  static calculateTotalTransactions(transactions: TransactionRecordEntity[] = []): number {
    const total = transactions.reduce((acc, t) => acc + t.amountToCharge, 0);
    return Number(total.toFixed(2));
  }

  // 2. Calcula el balance neto de entradas (+) y salidas (-)
  static calculateTotalCashInOut(cashMovements: CashInOutRecordEntity[] = []): number {
    const total = cashMovements.reduce((acc, m) => {
      return m.type === 'IN' ? acc + m.amount : acc - m.amount;
    }, 0);
    return Number(total.toFixed(2));
  }

  // 3. Calcula el desglose completo del cierre de caja
  static calculateBalance(
    openingCash: number,
    transactions: TransactionRecordEntity[] = [],
    cashMovements: CashInOutRecordEntity[] = [],
    cashProvided: number
  ): CashRegisterBalance {
    const totalTransactions = this.calculateTotalTransactions(transactions);
    const totalCashInOut = this.calculateTotalCashInOut(cashMovements);

    // Total Teórico = Efectivo Inicial + Ventas/Transacciones + Entradas/Salidas
    const totalExpected = Number((openingCash + totalTransactions + totalCashInOut).toFixed(2));

    // Diferencia = Efectivo Contado - Total Teórico Esperado
    const difference = Number((cashProvided - totalExpected).toFixed(2));

    return {
      totalTransactions,
      totalCashInOut,
      totalExpected,
      difference,
    };
  }
}