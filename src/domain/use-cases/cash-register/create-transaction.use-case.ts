import { CreateTransactionDto } from '../../dtos';
import { TransactionRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface CreateTransactionUseCase {
  execute(dto: CreateTransactionDto): Promise<TransactionRecordEntity>;
}

export class CreateTransaction implements CreateTransactionUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  execute(dto: CreateTransactionDto): Promise<TransactionRecordEntity> {
    return this.repository.createTransaction(dto);
  }
}