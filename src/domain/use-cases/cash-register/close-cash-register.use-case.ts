import { CloseCashRegisterDto } from '../../dtos';
import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface CloseCashRegisterUseCase {
  execute(dto: CloseCashRegisterDto): Promise<CashRegisterRecordEntity>;
}

export class CloseCashRegister implements CloseCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  execute(dto: CloseCashRegisterDto): Promise<CashRegisterRecordEntity> {
    return this.repository.close(dto);
  }
}