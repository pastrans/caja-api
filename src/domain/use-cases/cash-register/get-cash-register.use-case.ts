import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface GetCashRegisterUseCase {
  execute(id: number): Promise<CashRegisterRecordEntity>;
}

export class GetCashRegister implements GetCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  async execute(id: number): Promise<CashRegisterRecordEntity> {
    const record = await this.repository.findById(id);
    return record.sanitize();
  }
}