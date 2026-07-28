import { Router } from 'express';
import { EmployeesController } from './controller';
import { EmployeeDatasourceImpl, EmployeeRepositoryImpl } from '../../infrastructure';

export class EmployeeRoutes {
  static get routes(): Router {
    const router = Router();

    const datasource = new EmployeeDatasourceImpl();
    const employeeRepository = new EmployeeRepositoryImpl(datasource);
    const employeeController = new EmployeesController(employeeRepository);

    router.get('/', employeeController.getEmployees);
    router.get('/:id', employeeController.getEmployeeById);
    router.post('/', employeeController.createEmployee);
    router.put('/:id', employeeController.updateEmployee);
    router.delete('/:id', employeeController.deleteEmployee);

    return router;
  }
}