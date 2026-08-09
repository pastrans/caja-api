import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface GetActiveCashRegisterUseCase {
  execute(): Promise<CashRegisterRecordEntity | null>;
}

export class GetActiveCashRegister implements GetActiveCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  async execute(): Promise<CashRegisterRecordEntity | null> {
    const record = await this.repository.findActive();
    return record ? record.sanitize() : null;
  }
}