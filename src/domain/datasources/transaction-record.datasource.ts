import { CreateTransactionDto } from '../dtos/cash-register/create-transaction.dto';
import { TransactionRecordEntity } from '../entities/transaction-record.entity';

export abstract class TransactionRecordDatasource {
  abstract create(createDto: CreateTransactionDto): Promise<TransactionRecordEntity>;
  abstract findById(id: number): Promise<TransactionRecordEntity>;
  abstract getByCashRegisterId(cashRegisterRecordId: number): Promise<TransactionRecordEntity[]>;
  abstract getByEmployeeId(employeeId: number): Promise<TransactionRecordEntity[]>;
}