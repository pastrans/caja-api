export class CreateCashInOutDto {
  private constructor(
    public readonly cashRegisterRecordId: number,
    public readonly type: 'IN' | 'OUT',
    public readonly amount: number,
    public readonly reason: string,
    public readonly note?: string
  ) {}

  static create(props: { [key: string]: any }):  [string, undefined]  | [undefined, CreateCashInOutDto]  {
    const { cashRegisterRecordId, type, amount, reason, note } = props;

    if (!cashRegisterRecordId || isNaN(Number(cashRegisterRecordId))) {
      return  ['cashRegisterRecordId must be a valid number', undefined];
    }

    if (!type || (type !== 'IN' && type !== 'OUT')) {
      return ['type must be either IN or OUT', undefined];
    }

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      return ['amount must be a valid positive number', undefined];
    }

    if (!reason || typeof reason !== 'string') {
      return ['reason is required', undefined];
    }

    return [
      undefined,
      new CreateCashInOutDto(
        Number(cashRegisterRecordId),
        type,
        Number(amount),
        reason,
        note
      ),
    ];
  }
}