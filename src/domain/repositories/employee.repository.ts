import { CreateEmployeeDto, UpdateEmployeeDto, PaginationDto } from '../dtos';
import { EmployeeEntity } from '../entities/employee.entity';
import { EmployeePaginatedResult } from '../datasources/employee.datasource';

export abstract class EmployeeRepository {
  abstract create(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeEntity>;
  abstract getAll(paginationDto: PaginationDto): Promise<EmployeePaginatedResult>;
  abstract findById(id: number): Promise<EmployeeEntity | null>;
  abstract updateById(updateEmployeeDto: UpdateEmployeeDto): Promise<EmployeeEntity>;
  abstract deleteById(id: number): Promise<EmployeeEntity>;
}