import { UpdateEmployeeDto } from '../../dtos';
import { EmployeeEntity } from '../../entities';
import { EmployeeRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';

export interface UpdateEmployeeUseCase {
  execute(dto: UpdateEmployeeDto): Promise<EmployeeEntity>;
}

export class UpdateEmployee implements UpdateEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  async execute(dto: UpdateEmployeeDto): Promise<EmployeeEntity> {
    // 1. Validar existencia del empleado
    const employeeExists = await this.repository.findById(dto.id);
    if (!employeeExists) {
      throw CustomError.notFound(`Employee with id ${dto.id} not found`);
    }

    // 2. Persistir actualización
    return await this.repository.updateById(dto);
  }
}