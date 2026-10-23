import { CustomError } from '../errors/custom.error';
import { UserEntity } from './user.entity';

export class ClosingEntity {
  constructor(
    public id: number,
    public cashProvided: number,
    public difference: number,
    public totalTransactions: number, 
    public totalCashInOut: number,     
    public totalExpected: number,      
    public userId: number,
    public denominations?: any,
    public note?: string | null,
    public user?: UserEntity,
    public createdAt?: Date
  ) {}

  public static fromObject(object: { [key: string]: any }): ClosingEntity {
    const {
      id,
      cashProvided,
      difference,
      totalTransactions,
      totalCashInOut,
      totalExpected,
      userId,
      denominations,
      note,
      user,
      createdAt,
    } = object;

    if (!id) throw CustomError.internalServer('Closing ID is required');
    if (cashProvided === undefined) throw CustomError.internalServer('Closing cashProvided is required');
    if (difference === undefined) throw CustomError.internalServer('Closing difference is required');

    return new ClosingEntity(
      Number(id),
      Number(cashProvided),
      Number(difference),
      Number(totalTransactions ?? 0),
      Number(totalCashInOut ?? 0),     
      Number(totalExpected ?? 0),      
      Number(userId),
      denominations,
      note,
      user ? UserEntity.fromObject(user) : undefined,
      createdAt ? new Date(createdAt) : undefined
    );
  }
}