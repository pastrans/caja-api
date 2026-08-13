import { EmployeeEntity } from '../../entities';
import { CustomError } from '../../errors/custom.error';
import { EmployeeRepository } from '../../repositories';

export interface GetEmployeeUseCase {
  execute(id: number): Promise<EmployeeEntity>;
}

export class GetEmployee implements GetEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  async execute(id: number): Promise<EmployeeEntity> {
    const employee = await this.repository.findById(id);
    if (!employee) {
      throw CustomError.notFound(`Employee with id ${id} not found`);
    }

    return employee;
  }
}