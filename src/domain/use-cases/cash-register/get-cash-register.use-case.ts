import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface GetCashRegisterUseCase {
  execute(id: number): Promise<CashRegisterRecordEntity>;
}

export class GetCashRegister implements GetCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  execute(id: number): Promise<CashRegisterRecordEntity> {
    return this.repository.findById(id);
  }
}