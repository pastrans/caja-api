import { CloseCashRegisterDto } from '../../dtos';
import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface CloseCashRegisterUseCase {
  execute(dto: CloseCashRegisterDto): Promise<CashRegisterRecordEntity>;
}

export class CloseCashRegister implements CloseCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  async execute(dto: CloseCashRegisterDto): Promise<CashRegisterRecordEntity> {
    const record = await this.repository.close(dto);
    return record.sanitize();
  }
}