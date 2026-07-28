import { DenominationItem } from '../../interfaces/denomination-item';

export class OpenCashRegisterDto {
  private constructor(
    public readonly cash: number,
    public readonly userId: number,
    public readonly denominations: DenominationItem[],
    public readonly note?: string
  ) {}

  static create(props: { [key: string]: any }): [string, undefined]  | [undefined, OpenCashRegisterDto]  {
    const { cash, userId, denominations, note } = props;

    if (cash === undefined || cash === null || isNaN(Number(cash))) {
      return ['Initial cash amount must be a valid number', undefined];
    }

    if (!userId || isNaN(Number(userId))) {
      return ['userId must be a valid number', undefined];
    }

    if (!Array.isArray(denominations)) {
      return ['denominations must be an array', undefined];
    }

    return [
      undefined,
      new OpenCashRegisterDto(Number(cash), Number(userId), denominations, note),
    ];
  }
}