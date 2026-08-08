import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateTransactionDto,
  CreateCashInOutDto,
  PaginationDto,
} from '../dtos';
import {
  CashRegisterRecordEntity,
  TransactionRecordEntity,
  CashInOutRecordEntity,
} from '../entities';
import { CashRegisterPaginatedResult } from '../datasources/cash-register-record.datasource';

export abstract class CashRegisterRecordRepository {
  abstract open(openDto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity>;
  abstract close(closeDto: CloseCashRegisterDto): Promise<CashRegisterRecordEntity>;
  abstract findActive(): Promise<CashRegisterRecordEntity | null>;
  abstract findById(id: number): Promise<CashRegisterRecordEntity>;
  abstract getAll(paginationDto: PaginationDto): Promise<CashRegisterPaginatedResult>;
  abstract createTransaction(dto: CreateTransactionDto): Promise<TransactionRecordEntity>;
  abstract createCashInOut(dto: CreateCashInOutDto): Promise<CashInOutRecordEntity>;
}