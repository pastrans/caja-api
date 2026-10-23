import { CashInOutRecordEntity } from "./cash-in-out.entity";
import { ClosingEntity } from "./closing.entity";
import { OpeningEntity } from "./opening.entity";
import { TransactionRecordEntity } from "./transaction-record.entity";

// Resumen que acompaña a cada caja en los listados (en lugar del detalle completo)
export interface CashRegisterSummary {
  transactionsCount: number;
  totalTransactions: number;
  cashInOutCount: number;
  totalCashIn: number;
  totalCashOut: number;
}

export class CashRegisterRecordEntity {
  constructor(
    public id: number,
    public status: 'OPEN' | 'CLOSED',
    public opening?: OpeningEntity | null,
    public closing?: ClosingEntity | null,
    public transactions?: TransactionRecordEntity[],
    public cashInOut?: CashInOutRecordEntity[],
    public createdAt?: Date,
    public updatedAt?: Date,
    public summary?: CashRegisterSummary
  ) {}

  get isOpen(): boolean {
    return this.status === 'OPEN';
  }

  public sanitize(): CashRegisterRecordEntity {
    if (this.opening?.user) {
      this.opening.user.password = undefined;
    }
    if (this.closing?.user) {
      this.closing.user.password = undefined;
    }
    return this;
  }

  public static fromObject(object: { [key: string]: any }): CashRegisterRecordEntity {
    const {
      id,
      status,
      opening,
      closing,
      transactions,
      cashInOut,
      createdAt,
      updatedAt,
      summary,
    } = object;

    return new CashRegisterRecordEntity(
      Number(id),
      status,
      opening ? OpeningEntity.fromObject(opening) : null,
      closing ? ClosingEntity.fromObject(closing) : null, // 👈 Pasa el objeto completo de Prisma
      // En listados no se cargan transacciones ni movimientos (quedan undefined), solo el resumen
      transactions ? transactions.map(TransactionRecordEntity.fromObject) : undefined,
      cashInOut ? cashInOut.map(CashInOutRecordEntity.fromObject) : undefined,
      createdAt ? new Date(createdAt) : undefined,
      updatedAt ? new Date(updatedAt) : undefined,
      summary
    );
  }
}