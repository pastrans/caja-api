import { UpdateEmployeeDto } from '../../dtos';
import { EmployeeEntity } from '../../entities';
import { EmployeeRepository } from '../../repositories';

export interface UpdateEmployeeUseCase {
  execute(dto: UpdateEmployeeDto): Promise<EmployeeEntity>;
}

export class UpdateEmployee implements UpdateEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  execute(dto: UpdateEmployeeDto): Promise<EmployeeEntity> {
    return this.repository.updateById(dto);
  }
}