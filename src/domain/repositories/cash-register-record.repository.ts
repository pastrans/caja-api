import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateTransactionDto,
  CreateCashInOutDto,
} from '../dtos';
import {
  CashRegisterRecordEntity,
  TransactionRecordEntity,
  CashInOutRecordEntity,
} from '../entities';

export abstract class CashRegisterRecordRepository {
  abstract open(openDto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity>;
  abstract close(closeDto: CloseCashRegisterDto): Promise<CashRegisterRecordEntity>;
  abstract findActive(): Promise<CashRegisterRecordEntity | null>;
  abstract findById(id: number): Promise<CashRegisterRecordEntity>;
  abstract getAll(): Promise<CashRegisterRecordEntity[]>;
  abstract createTransaction(dto: CreateTransactionDto): Promise<TransactionRecordEntity>;
  abstract createCashInOut(dto: CreateCashInOutDto): Promise<CashInOutRecordEntity>;
}