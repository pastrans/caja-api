import { prisma } from '../../data/postgres';
import {
  EmployeeDatasource,
  EmployeeEntity,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '../../domain';

export class EmployeeDatasourceImpl implements EmployeeDatasource {
  async create(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeEntity> {
    const employee = await prisma.employee.create({
      data: createEmployeeDto,
    });
    return EmployeeEntity.fromObject(employee);
  }

  async getAll(): Promise<EmployeeEntity[]> {
    const employees = await prisma.employee.findMany();
    return employees.map(EmployeeEntity.fromObject);
  }

  async findById(id: number): Promise<EmployeeEntity> {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) throw `Employee with id ${id} not found`;
    return EmployeeEntity.fromObject(employee);
  }

  async updateById(updateEmployeeDto: UpdateEmployeeDto): Promise<EmployeeEntity> {
    await this.findById(updateEmployeeDto.id);

    const updated = await prisma.employee.update({
      where: { id: updateEmployeeDto.id },
      data: updateEmployeeDto.values,
    });

    return EmployeeEntity.fromObject(updated);
  }

  async deleteById(id: number): Promise<EmployeeEntity> {
    await this.findById(id);
    const deleted = await prisma.employee.delete({ where: { id } });
    return EmployeeEntity.fromObject(deleted);
  }
}