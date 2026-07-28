import { OpenCashRegisterDto } from '../../dtos';
import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface OpenCashRegisterUseCase {
  execute(dto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity>;
}

export class OpenCashRegister implements OpenCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  execute(dto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity> {
    return this.repository.open(dto);
  }
}