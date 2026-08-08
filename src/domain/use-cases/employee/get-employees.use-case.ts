import { PaginationDto } from '../../dtos';
import { EmployeeEntity } from '../../entities';
import { EmployeeRepository } from '../../repositories';
import { PaginatedResponse } from '../../interfaces/paginated-response.interface';
import { PaginationHelper } from '../../helpers/pagination.helper';

export interface GetEmployeesUseCase {
  execute(paginationDto: PaginationDto): Promise<PaginatedResponse<EmployeeEntity>>;
}

export class GetEmployees implements GetEmployeesUseCase {
  constructor(
    private readonly repository: EmployeeRepository,
    private readonly path: string = '/api/employees'
  ) {}

  async execute(paginationDto: PaginationDto): Promise<PaginatedResponse<EmployeeEntity>> {
    const { employees, total } = await this.repository.getAll(paginationDto);

    return PaginationHelper.createResponse<EmployeeEntity>(
      employees,
      total,
      paginationDto,
      this.path
    );
  }
}