import { CustomError } from '../errors/custom.error';
import { DenominationItem } from "../interfaces/denomination-item";
import { UserEntity } from "./user.entity";

export class OpeningEntity {
  constructor(
    public id: number,
    public cash: number,
    public cashRegisterRecordId: number,
    public userId: number,
    public denominations: DenominationItem[],
    public date: Date,
    public note?: string | null,
    public user?: UserEntity
  ) {}

  public static fromObject(object: { [key: string]: any }): OpeningEntity {
    const { id, cash, cashRegisterRecordId, userId, denominations, date, note, user } = object;

    if (!id) throw CustomError.internalServer('Opening ID is required');
    if (cash === undefined || cash === null) throw CustomError.internalServer('Cash amount is required');
    if (!cashRegisterRecordId) throw CustomError.internalServer('CashRegisterRecordId is required');
    if (!userId) throw CustomError.internalServer('User ID is required');

    const parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate.getTime())) throw CustomError.internalServer('Invalid date format in Opening');

    return new OpeningEntity(
      Number(id),
      Number(cash),
      Number(cashRegisterRecordId),
      Number(userId),
      Array.isArray(denominations) ? denominations : [],
      parsedDate,
      note,
      user ? UserEntity.fromObject(user) : undefined
    );
  }
}