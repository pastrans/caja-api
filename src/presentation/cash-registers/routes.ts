import { Router } from 'express';
import { CashRegistersController } from './controller';
import {
  CashRegisterRecordDatasourceImpl,
  CashRegisterRecordRepositoryImpl,
  UserRepositoryImpl,
  UserDatasourceImpl,
  EmployeeDatasourceImpl,
  EmployeeRepositoryImpl,
} from '../../infrastructure';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class CashRegisterRoutes {
  static get routes(): Router {
    const router = Router();


    const userRepository = new UserRepositoryImpl(new UserDatasourceImpl());
    const cashDatasource = new CashRegisterRecordDatasourceImpl();
    const cashRepository = new CashRegisterRecordRepositoryImpl(cashDatasource);

    const employeeDatasource = new EmployeeDatasourceImpl();
    const employeeRepository = new EmployeeRepositoryImpl(employeeDatasource);
    const controller = new CashRegistersController(cashRepository, employeeRepository);

    // const requireAdmin = AuthMiddleware.validateJWT(userRepository,'ADMIN');
    const allowAllRoles = AuthMiddleware.validateJWT(userRepository, 'ADMIN', 'CASHIER');
    // Rutas principales de la caja
    router.post('/open', allowAllRoles, controller.openCashRegister);
    router.post('/close', allowAllRoles, controller.closeCashRegister);
    router.get('/active', allowAllRoles, controller.getActiveCashRegister);
    router.get('/', allowAllRoles, controller.getCashRegisters);
    router.get('/:id', allowAllRoles, controller.getCashRegisterById);

    // Movimientos dentro de la caja activa
    router.post('/transactions', allowAllRoles, controller.createTransaction);
    router.post('/cash-in-out', allowAllRoles, controller.createCashInOut);

    return router;
  }
}