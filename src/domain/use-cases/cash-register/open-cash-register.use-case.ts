import { OpenCashRegisterDto } from '../../dtos';
import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';

export interface OpenCashRegisterUseCase {
  execute(dto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity>;
}

export class OpenCashRegister implements OpenCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  async execute(dto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity> {
    // 1. Regla de negocio: No se puede abrir una caja si ya hay una activa
    const activeRegister = await this.repository.findActive();
    if (activeRegister) {
      throw CustomError.badRequest('There is already an active cash register open');
    }

    // 2. Persistir la apertura
    const record = await this.repository.open(dto);

    // 3. Sanitizar
    return record.sanitize();
  }
}