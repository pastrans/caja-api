import { CreateCashInOutDto } from '../../dtos';
import { CashInOutRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';

export interface CreateCashInOutUseCase {
  execute(dto: CreateCashInOutDto): Promise<CashInOutRecordEntity>;
}

export class CreateCashInOut implements CreateCashInOutUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  async execute(dto: CreateCashInOutDto): Promise<CashInOutRecordEntity> {
    // 1. Regla de negocio: Verificar que la caja existe (findById lanza 404 si no existe)
    const cashRegister = await this.repository.findById(dto.cashRegisterRecordId);

    // 2. Regla de negocio: La caja NO debe estar cerrada
    if (cashRegister.status !== 'OPEN') {
      throw CustomError.badRequest('Cannot record cash movement on a closed cash register');
    }

    // 3. Persistir el movimiento de dinero
    return await this.repository.createCashInOut(dto);
  }
}