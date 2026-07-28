import { Router } from 'express';
import { UserRoutes } from './users/routes';
import { EmployeeRoutes } from './employees/routes';
import { CashRegisterRoutes } from './cash-registers/routes';

export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    router.use('/api/v1/users', UserRoutes.routes);
    router.use('/api/v1/employees', EmployeeRoutes.routes);
    router.use('/api/v1/cash-registers', CashRegisterRoutes.routes);

    return router;
  }
}