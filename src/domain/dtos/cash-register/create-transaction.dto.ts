import { DenominationItem } from '../../interfaces/denomination-item';


export class CreateTransactionDto {
  private constructor(
    public readonly cashRegisterRecordId: number,
    public readonly employeeId: number,
    public readonly amountToCharge: number,
    public readonly cashProvided: number,
    public readonly changeReturned: number,
    public readonly denominations: DenominationItem[],
    public readonly note?: string
  ) {}

  static create(props: { [key: string]: any }): [string, undefined]  | [undefined, CreateTransactionDto] {
    const {
      cashRegisterRecordId,
      employeeId,
      amountToCharge,
      cashProvided,
      changeReturned,
      denominations,
      note,
    } = props;

    if (!cashRegisterRecordId || isNaN(Number(cashRegisterRecordId))) {
      return ['cashRegisterRecordId must be a valid number', undefined];
    }

    if (!employeeId || isNaN(Number(employeeId))) {
      return ['employeeId must be a valid number', undefined];
    }

    if (amountToCharge === undefined || isNaN(Number(amountToCharge))) {
      return ['amountToCharge must be a valid number', undefined];
    }

    if (cashProvided === undefined || isNaN(Number(cashProvided))) {
      return ['cashProvided must be a valid number', undefined];
    }

    if (changeReturned === undefined || isNaN(Number(changeReturned))) {
      return ['changeReturned must be a valid number', undefined];
    }

    if (!Array.isArray(denominations)) {
      return ['denominations must be an array', undefined];
    }

    return [
      undefined,
      new CreateTransactionDto(
        Number(cashRegisterRecordId),
        Number(employeeId),
        Number(amountToCharge),
        Number(cashProvided),
        Number(changeReturned),
        denominations,
        note
      ),
    ];
  }
}