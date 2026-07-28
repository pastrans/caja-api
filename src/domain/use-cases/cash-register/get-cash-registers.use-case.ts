import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface GetCashRegistersUseCase {
  execute(): Promise<CashRegisterRecordEntity[]>;
}

export class GetCashRegisters implements GetCashRegistersUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  execute(): Promise<CashRegisterRecordEntity[]> {
    return this.repository.getAll();
  }
}