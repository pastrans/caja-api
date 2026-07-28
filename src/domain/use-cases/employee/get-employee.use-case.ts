import { EmployeeEntity } from '../../entities';
import { EmployeeRepository } from '../../repositories';

export interface GetEmployeeUseCase {
  execute(id: number): Promise<EmployeeEntity>;
}

export class GetEmployee implements GetEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  execute(id: number): Promise<EmployeeEntity> {
    return this.repository.findById(id);
  }
}