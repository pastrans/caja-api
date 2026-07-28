export class CashInOutRecordEntity {
  constructor(
    public id: number,
    public type: 'IN' | 'OUT',
    public amount: number,
    public reason: string,
    public cashRegisterRecordId: number,
    public date: Date,
    public note?: string | null
  ) {}

  public static fromObject(object: { [key: string]: any }): CashInOutRecordEntity {
    const { id, type, amount, reason, cashRegisterRecordId, date, note } = object;

    if (!id) throw 'CashInOutRecord ID is required';
    if (!type || (type !== 'IN' && type !== 'OUT')) throw 'Valid type (IN/OUT) is required';
    if (amount === undefined || amount === null) throw 'Amount is required';
    if (!reason) throw 'Reason is required';
    if (!cashRegisterRecordId) throw 'CashRegisterRecordId is required';

    const parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate.getTime())) throw 'Invalid date format in CashInOutRecord';

    return new CashInOutRecordEntity(
      Number(id),
      type,
      Number(amount),
      reason,
      Number(cashRegisterRecordId),
      parsedDate,
      note
    );
  }
}