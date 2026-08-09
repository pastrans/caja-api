import { OpenCashRegisterDto } from '../../dtos';
import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';

export interface OpenCashRegisterUseCase {
  execute(dto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity>;
}

export class OpenCashRegister implements OpenCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  async execute(dto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity> {
    const record = await this.repository.open(dto);
    return record.sanitize(); 
  }
}