import { CreateTransactionDto } from '../../dtos';
import { TransactionRecordEntity } from '../../entities';
import { CashRegisterRecordRepository, EmployeeRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';

export interface CreateTransactionUseCase {
  execute(dto: CreateTransactionDto): Promise<TransactionRecordEntity>;
}

export class CreateTransaction implements CreateTransactionUseCase {
  constructor(
    private readonly cashRegisterRepository: CashRegisterRecordRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(dto: CreateTransactionDto): Promise<TransactionRecordEntity> {
    // 1. Validar que la caja exista
    const cashRegister = await this.cashRegisterRepository.findById(dto.cashRegisterRecordId);
    if (!cashRegister) {
      throw CustomError.notFound(`Cash register record with ID ${dto.cashRegisterRecordId} not found`);
    }

    // 2. Validar que la caja NO esté cerrada
    if (cashRegister.status === 'CLOSED') {
      throw CustomError.badRequest('Cannot create a transaction on a closed cash register');
    }

    // 3. Validar que el empleado exista
    const employee = await this.employeeRepository.findById(dto.employeeId);
    if (!employee) {
      throw CustomError.notFound(`Assigned employee with ID ${dto.employeeId} does not exist`);
    }

    // 4. Verificar si el empleado está activo/disponible
    if (!employee.available) {
      throw CustomError.badRequest(`Employee ${employee.name} is disabled and cannot make transactions`);
    }

    // 5. Guardar la transacción
    return await this.cashRegisterRepository.createTransaction(dto);
  }
}