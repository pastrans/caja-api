import { DenominationHelper, DenominationItem } from '../../helpers/denomination.helper';

export class OpenCashRegisterDto {
  private constructor(
    public readonly cash: number,
    public readonly userId: number,
    public readonly denominations: DenominationItem[],
    public readonly note: string,
  ) {}

  static create(props: { [key: string]: any }): [string, undefined]  | [undefined, OpenCashRegisterDto] {
    const { cash, userId, denominations, note } = props;

    // 1. Validar userId
    if (userId === undefined || isNaN(Number(userId))) {
      return ['User ID is required and must be a valid number', undefined];
    }

    // 2. Validar cash (obligatorio, número mayor o igual a 0)
    if (cash === undefined || isNaN(Number(cash)) || Number(cash) < 0) {
      return ['Cash is required and must be a non-negative number', undefined];
    }

    const cashNum = Number(cash);

    // 3. Validar denominaciones si vienen presentes
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
      new OpenCashRegisterDto(cashNum, Number(userId), denominations, note?.trim()),
    ];
  }
}