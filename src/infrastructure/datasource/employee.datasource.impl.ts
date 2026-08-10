import { prisma } from '../../data/postgres';
import {
  EmployeeDatasource,
  EmployeeEntity,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  PaginationDto,
  EmployeePaginatedResult,
} from '../../domain';

export class EmployeeDatasourceImpl implements EmployeeDatasource {
  async create(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeEntity> {
    const employee = await prisma.employee.create({
      data: createEmployeeDto,
    });
    return EmployeeEntity.fromObject(employee);
  }

  async getAll(paginationDto: PaginationDto): Promise<EmployeePaginatedResult> {
    const { page, limit, available } = paginationDto;

    const whereCondition = available !== undefined ? { available } : {};

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where: whereCondition }),
      prisma.employee.findMany({
        where: whereCondition,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      total,
      employees: employees.map(EmployeeEntity.fromObject),
    };
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

    const deleted = await prisma.employee.update({
      where: { id },
      data: { available: false },
    });

    return EmployeeEntity.fromObject(deleted);
  }
}