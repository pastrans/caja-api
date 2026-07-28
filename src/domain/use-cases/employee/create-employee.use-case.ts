import { CreateEmployeeDto } from '../../dtos';
import { EmployeeEntity } from '../../entities';
import { EmployeeRepository } from '../../repositories';

export interface CreateEmployeeUseCase {
  execute(dto: CreateEmployeeDto): Promise<EmployeeEntity>;
}

export class CreateEmployee implements CreateEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  execute(dto: CreateEmployeeDto): Promise<EmployeeEntity> {
    return this.repository.create(dto);
  }
}