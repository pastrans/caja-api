import { Request, Response } from 'express';
import {
  CreateEmployee,
  CreateEmployeeDto,
  DeleteEmployee,
  EmployeeRepository,
  GetEmployee,
  GetEmployees,
  UpdateEmployee,
  UpdateEmployeeDto,
} from '../../domain';

export class EmployeesController {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  public getEmployees = (req: Request, res: Response) => {
    new GetEmployees(this.employeeRepository)
      .execute()
      .then((employees) => res.json(employees))
      .catch((error) => res.status(400).json({ error }));
  };

  public getEmployeeById = (req: Request, res: Response) => {
    const id = +req.params.id!;

    new GetEmployee(this.employeeRepository)
      .execute(id)
      .then((employee) => res.json(employee))
      .catch((error) => res.status(400).json({ error }));
  };

  public createEmployee = (req: Request, res: Response) => {
    const [error, createEmployeeDto] = CreateEmployeeDto.create(req.body);
    if (error) return res.status(400).json({ error });

    new CreateEmployee(this.employeeRepository)
      .execute(createEmployeeDto!)
      .then((employee) => res.json(employee))
      .catch((error) => res.status(400).json({ error }));
  };

  public updateEmployee = (req: Request, res: Response) => {
    const id = +req.params.id!;
    const [error, updateEmployeeDto] = UpdateEmployeeDto.create({ ...req.body, id });
    if (error) return res.status(400).json({ error });

    new UpdateEmployee(this.employeeRepository)
      .execute(updateEmployeeDto!)
      .then((employee) => res.json(employee))
      .catch((error) => res.status(400).json({ error }));
  };

  public deleteEmployee = (req: Request, res: Response) => {
    const id = +req.params.id!;

    new DeleteEmployee(this.employeeRepository)
      .execute(id)
      .then((employee) => res.json(employee))
      .catch((error) => res.status(400).json({ error }));
  };
}