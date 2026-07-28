import { DenominationItem } from "../interfaces/denomination-item";
import { UserEntity } from "./user.entity";

export class ClosingEntity {
  constructor(
    public id: number,
    public cashProvided: number,
    public difference: number,
    public cashRegisterRecordId: number,
    public userId: number,
    public denominations: DenominationItem[],
    public date: Date,
    public note?: string | null,
    public user?: UserEntity
  ) {}

  public static fromObject(object: { [key: string]: any }): ClosingEntity {
    const { id, cashProvided, difference, cashRegisterRecordId, userId, denominations, date, note, user } = object;

    if (!id) throw 'Closing ID is required';
    if (cashProvided === undefined || cashProvided === null) throw 'Cash provided is required';
    if (difference === undefined || difference === null) throw 'Difference is required';
    if (!cashRegisterRecordId) throw 'CashRegisterRecordId is required';
    if (!userId) throw 'User ID is required';

    const parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate.getTime())) throw 'Invalid date format in Closing';

    return new ClosingEntity(
      Number(id),
      Number(cashProvided),
      Number(difference),
      Number(cashRegisterRecordId),
      Number(userId),
      Array.isArray(denominations) ? denominations : [],
      parsedDate,
      note,
      user ? UserEntity.fromObject(user) : undefined
    );
  }
}