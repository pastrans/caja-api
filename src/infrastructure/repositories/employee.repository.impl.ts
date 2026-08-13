import {
  EmployeeRepository,
  EmployeeDatasource,
  EmployeeEntity,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  PaginationDto,
  EmployeePaginatedResult,
} from '../../domain';

export class EmployeeRepositoryImpl implements EmployeeRepository {
  constructor(private readonly datasource: EmployeeDatasource) {}

  create(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeEntity> {
    return this.datasource.create(createEmployeeDto);
  }

  getAll(paginationDto: PaginationDto): Promise<EmployeePaginatedResult> {
    return this.datasource.getAll(paginationDto);
  }

  findById(id: number): Promise<EmployeeEntity | null> {
    return this.datasource.findById(id);
  }

  updateById(updateEmployeeDto: UpdateEmployeeDto): Promise<EmployeeEntity> {
    return this.datasource.updateById(updateEmployeeDto);
  }

  deleteById(id: number): Promise<EmployeeEntity> {
    return this.datasource.deleteById(id);
  }
}