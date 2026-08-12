import { Router } from 'express';
import { EmployeesController } from './controller';
import { EmployeeDatasourceImpl, EmployeeRepositoryImpl, UserDatasourceImpl, UserRepositoryImpl } from '../../infrastructure';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class EmployeeRoutes {
  static get routes(): Router {
    const router = Router();

    const datasource = new EmployeeDatasourceImpl();
    const employeeRepository = new EmployeeRepositoryImpl(datasource);
    const employeeController = new EmployeesController(employeeRepository);
    const userRepository = new UserRepositoryImpl(new UserDatasourceImpl());

    const requireAdmin = AuthMiddleware.validateJWT(userRepository,'ADMIN');
    const allowAllRoles = AuthMiddleware.validateJWT(userRepository, 'ADMIN', 'CASHIER');

    router.get('/', allowAllRoles, employeeController.getEmployees);
    router.get('/:id', allowAllRoles, employeeController.getEmployeeById);
    router.post('/', requireAdmin, employeeController.createEmployee);
    router.put('/:id', requireAdmin, employeeController.updateEmployee);
    router.delete('/:id', requireAdmin, employeeController.deleteEmployee);

    return router;
  }
}