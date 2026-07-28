import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface GetActiveCashRegisterUseCase {
  execute(): Promise<CashRegisterRecordEntity | null>;
}

export class GetActiveCashRegister implements GetActiveCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  execute(): Promise<CashRegisterRecordEntity | null> {
    return this.repository.findActive();
  }
}