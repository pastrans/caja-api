import { DenominationItem, DenominationHelper } from '../../helpers/denomination.helper';

export class CreateTransactionDto {
  private constructor(
    public readonly amountToCharge: number,
    public readonly cashProvided: number,
    public readonly changeReturned: number,
    public readonly cashRegisterRecordId: number,
    public readonly employeeId: number,
    public readonly denominations?: DenominationItem[],
    public readonly note?: string,
  ) {}

  static create(props: { [key: string]: any }): [string, undefined]  | [undefined, CreateTransactionDto] {
    const {
      amountToCharge,
      cashProvided,
      changeReturned,
      cashRegisterRecordId,
      employeeId,
      denominations,
      note,
    } = props;

    // 1. Validar IDs obligatorios
    if (cashRegisterRecordId === undefined || isNaN(Number(cashRegisterRecordId)) || Number(cashRegisterRecordId) <= 0) {
      return ['cashRegisterRecordId is required and must be a positive integer', undefined];
    }

    if (employeeId === undefined || isNaN(Number(employeeId)) || Number(employeeId) <= 0) {
      return ['employeeId is required and must be a positive integer', undefined];
    }

    // 2. Validar montos obligatorios
    if (amountToCharge === undefined || isNaN(Number(amountToCharge)) || Number(amountToCharge) <= 0) {
      return ['amountToCharge is required and must be a positive number', undefined];
    }

    if (cashProvided === undefined || isNaN(Number(cashProvided)) || Number(cashProvided) < 0) {
      return ['cashProvided is required and must be a non-negative number', undefined];
    }

    if (changeReturned === undefined || isNaN(Number(changeReturned)) || Number(changeReturned) < 0) {
      return ['changeReturned is required and must be a non-negative number', undefined];
    }

    const amountNum = Number(amountToCharge);
    const cashNum = Number(cashProvided);
    const changeNum = Number(changeReturned);

    // 3. Regla matemática: cashProvided >= amountToCharge
    if (cashNum < amountNum) {
      return ['cashProvided must be greater than or equal to amountToCharge', undefined];
    }

    // 4. Regla matemática: changeReturned === cashProvided - amountToCharge
    const expectedChange = Number((cashNum - amountNum).toFixed(2));
    if (Number(changeNum.toFixed(2)) !== expectedChange) {
      return [
        `changeReturned (${changeNum}) must equal cashProvided minus amountToCharge (${expectedChange})`,
        undefined,
      ];
    }

    // 5. Validar denominaciones respecto a cashProvided
    if (denominations !== undefined) {
      if (!Array.isArray(denominations)) {
        return ['Denominations must be an array', undefined];
      }

      const denominationError = DenominationHelper.validateSum(cashNum, denominations);
      if (denominationError) {
        return [denominationError, undefined];
      }
    }

    return [
      undefined,
      new CreateTransactionDto(
        amountNum,
        cashNum,
        changeNum,
        Number(cashRegisterRecordId),
        Number(employeeId),
        denominations,
        note?.trim(),
      ),
    ];
  }
}