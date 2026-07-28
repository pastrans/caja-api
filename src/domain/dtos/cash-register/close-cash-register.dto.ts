import { DenominationItem } from '../../interfaces/denomination-item';

export class CloseCashRegisterDto {
  private constructor(
    public readonly cashRegisterRecordId: number,
    public readonly cashProvided: number,
    public readonly difference: number,
    public readonly userId: number,
    public readonly denominations: DenominationItem[],
    public readonly note?: string
  ) {}

  static create(props: { [key: string]: any }): [string, undefined]  | [undefined, CloseCashRegisterDto]  {
    const { cashRegisterRecordId, cashProvided, difference, userId, denominations, note } = props;

    if (!cashRegisterRecordId || isNaN(Number(cashRegisterRecordId))) {
      return ['cashRegisterRecordId must be a valid number', undefined];
    }

    if (cashProvided === undefined || isNaN(Number(cashProvided))) {
      return ['cashProvided must be a valid number', undefined];
    }

    if (difference === undefined || isNaN(Number(difference))) {
      return ['difference must be a valid number', undefined];
    }

    if (!userId || isNaN(Number(userId))) {
      return ['userId must be a valid number', undefined];
    }

    if (!Array.isArray(denominations)) {
      return ['denominations must be an array', undefined];
    }

    return [
      undefined,
      new CloseCashRegisterDto(
        Number(cashRegisterRecordId),
        Number(cashProvided),
        Number(difference),
        Number(userId),
        denominations,
        note
      ),
    ];
  }
}