import { CreateCashInOutDto } from '../../dtos';
import { CashInOutRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface CreateCashInOutUseCase {
  execute(dto: CreateCashInOutDto): Promise<CashInOutRecordEntity>;
}

export class CreateCashInOut implements CreateCashInOutUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  execute(dto: CreateCashInOutDto): Promise<CashInOutRecordEntity> {
    return this.repository.createCashInOut(dto);
  }
}