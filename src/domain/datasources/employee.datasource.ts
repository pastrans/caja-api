import { CreateEmployeeDto, UpdateEmployeeDto } from '../dtos';
import { EmployeeEntity } from '../entities/employee.entity';

export abstract class EmployeeDatasource {
  abstract create(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeEntity>;
  abstract getAll(): Promise<EmployeeEntity[]>;
  abstract findById(id: number): Promise<EmployeeEntity>;
  abstract updateById(updateEmployeeDto: UpdateEmployeeDto): Promise<EmployeeEntity>;
  abstract deleteById(id: number): Promise<EmployeeEntity>;
}