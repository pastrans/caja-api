import { DenominationHelper, DenominationItem } from '../../helpers/denomination.helper';

export class CloseCashRegisterDto {
  private constructor(
    public readonly cashRegisterRecordId: number,
    public readonly cashProvided: number,
    public readonly difference: number,
    public readonly totalTransactions: number,
    public readonly totalCashInOut: number,
    public readonly totalExpected: number,
    public readonly userId: number,
    public readonly denominations?: DenominationItem[],
    public readonly note?: string
  ) {}

  static create(props: { [key: string]: any }): [string, undefined?] |  [undefined, CloseCashRegisterDto]{
    const {
      cashRegisterRecordId,
      cashProvided,
      difference,
      totalTransactions,
      totalCashInOut,
      totalExpected,
      userId,
      denominations,
      note,
    } = props;

    // 1. Validar IDs
    if (!cashRegisterRecordId || isNaN(Number(cashRegisterRecordId)) || Number(cashRegisterRecordId) <= 0) {
      return ['cashRegisterRecordId must be a valid positive number', undefined];
    }

    if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
      return ['userId must be a valid positive number', undefined];
    }

    // 2. Validar Campos Numéricos
    if (cashProvided === undefined || isNaN(Number(cashProvided)) || Number(cashProvided) < 0) {
      return ['cashProvided must be a non-negative number', undefined];
    }

    if (difference === undefined || isNaN(Number(difference))) {
      return ['difference must be a valid number', undefined];
    }

    if (totalTransactions === undefined || isNaN(Number(totalTransactions)) || Number(totalTransactions) < 0) {
      return ['totalTransactions must be a non-negative number', undefined];
    }

    if (totalCashInOut === undefined || isNaN(Number(totalCashInOut))) {
      return ['totalCashInOut must be a valid number', undefined];
    }

    if (totalExpected === undefined || isNaN(Number(totalExpected)) || Number(totalExpected) < 0) {
      return ['totalExpected must be a non-negative number', undefined];
    }

    const cashProvidedNum = Number(cashProvided);

    // 3. Validar Denominaciones si están presentes
    if (denominations !== undefined) {
      if (!Array.isArray(denominations)) {
        return ['Denominations must be an array', undefined];
      }

      const denominationError = DenominationHelper.validateSum(cashProvidedNum, denominations);
      if (denominationError) {
        return [denominationError, undefined];
      }
    }

    return [
      undefined,
      new CloseCashRegisterDto(
        Number(cashRegisterRecordId),
        cashProvidedNum,
        Number(difference),
        Number(totalTransactions),
        Number(totalCashInOut),
        Number(totalExpected),
        Number(userId),
        denominations,
        note?.trim()
      ),
    ];
  }
}