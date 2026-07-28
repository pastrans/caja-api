import { EmployeeEntity } from '../../entities';
import { EmployeeRepository } from '../../repositories';

export interface DeleteEmployeeUseCase {
  execute(id: number): Promise<EmployeeEntity>;
}

export class DeleteEmployee implements DeleteEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  execute(id: number): Promise<EmployeeEntity> {
    return this.repository.deleteById(id);
  }
}