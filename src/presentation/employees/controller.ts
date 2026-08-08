import { Request, Response, NextFunction } from 'express';
import {
  CreateEmployee,
  CreateEmployeeDto,
  DeleteEmployee,
  EmployeeRepository,
  GetEmployee,
  GetEmployees,
  UpdateEmployee,
  UpdateEmployeeDto,
  PaginationDto,
  CustomError,
} from '../../domain';

export class EmployeesController {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  public getEmployees = (req: Request, res: Response, next: NextFunction) => {
    const { page, limit } = req.query;

    const [error, paginationDto] = PaginationDto.create({ page, limit });
    if (error) return next(CustomError.badRequest(error));

    new GetEmployees(this.employeeRepository, req.baseUrl)
      .execute(paginationDto!)
      .then((employees) => res.json(employees))
      .catch(next);
  };

  public getEmployeeById = (req: Request, res: Response, next: NextFunction) => {
    const id = +req.params.id!;
    if (isNaN(id)) return next(CustomError.badRequest('Invalid ID format'));

    new GetEmployee(this.employeeRepository)
      .execute(id)
      .then((employee) => res.json(employee))
      .catch(next);
  };

  public createEmployee = (req: Request, res: Response, next: NextFunction) => {
    const [error, createEmployeeDto] = CreateEmployeeDto.create(req.body);
    if (error) return next(CustomError.badRequest(error));

    new CreateEmployee(this.employeeRepository)
      .execute(createEmployeeDto!)
      .then((employee) => res.json(employee))
      .catch(next);
  };

  public updateEmployee = (req: Request, res: Response, next: NextFunction) => {
    const id = +req.params.id!;
    if (isNaN(id)) return next(CustomError.badRequest('Invalid ID format'));

    const [error, updateEmployeeDto] = UpdateEmployeeDto.create({ ...req.body, id });
    if (error) return next(CustomError.badRequest(error));

    new UpdateEmployee(this.employeeRepository)
      .execute(updateEmployeeDto!)
      .then((employee) => res.json(employee))
      .catch(next);
  };

  public deleteEmployee = (req: Request, res: Response, next: NextFunction) => {
    const id = +req.params.id!;
    if (isNaN(id)) return next(CustomError.badRequest('Invalid ID format'));

    new DeleteEmployee(this.employeeRepository)
      .execute(id)
      .then((employee) => res.json(employee))
      .catch(next);
  };
}