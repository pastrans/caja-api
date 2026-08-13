import { CreateEmployeeDto, UpdateEmployeeDto, PaginationDto } from '../dtos';
import { EmployeeEntity } from '../entities/employee.entity';

export interface EmployeePaginatedResult {
  employees: EmployeeEntity[];
  total: number;
}

export abstract class EmployeeDatasource {
  abstract create(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeEntity>;
  abstract getAll(paginationDto: PaginationDto): Promise<EmployeePaginatedResult>; 
  abstract findById(id: number): Promise<EmployeeEntity | null>;
  abstract updateById(updateEmployeeDto: UpdateEmployeeDto): Promise<EmployeeEntity>;
  abstract deleteById(id: number): Promise<EmployeeEntity>;
}