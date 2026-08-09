import { CashInOutRecordEntity } from "./cash-in-out.entity";
import { ClosingEntity } from "./closing.entity";
import { OpeningEntity } from "./opening.entity";
import { TransactionRecordEntity } from "./transaction-record.entity";

export class CashRegisterRecordEntity {
  constructor(
    public id: number,
    public status: 'OPEN' | 'CLOSED',
    public opening?: OpeningEntity | null,
    public closing?: ClosingEntity | null,
    public transactions?: TransactionRecordEntity[],
    public cashInOut?: CashInOutRecordEntity[],
    public createdAt?: Date,
    public updatedAt?: Date
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
      updatedAt
    } = object;

    if (!id) throw 'CashRegisterRecord ID is required';

    return new CashRegisterRecordEntity(
      Number(id),
      status ?? 'OPEN',
      opening ? OpeningEntity.fromObject(opening) : null,
      closing ? ClosingEntity.fromObject(closing) : null,
      Array.isArray(transactions)
        ? transactions.map(t => TransactionRecordEntity.fromObject(t))
        : [],
      Array.isArray(cashInOut)
        ? cashInOut.map(c => CashInOutRecordEntity.fromObject(c))
        : [],
      createdAt ? new Date(createdAt) : undefined,
      updatedAt ? new Date(updatedAt) : undefined
    );
  }
}