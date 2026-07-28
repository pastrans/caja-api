import { EmployeeEntity } from '../../entities';
import { EmployeeRepository } from '../../repositories';

export interface GetEmployeesUseCase {
  execute(): Promise<EmployeeEntity[]>;
}

export class GetEmployees implements GetEmployeesUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  execute(): Promise<EmployeeEntity[]> {
    return this.repository.getAll();
  }
}