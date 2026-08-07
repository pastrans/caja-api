import { Router } from 'express';
import { UserRoutes } from './users/routes';
import { EmployeeRoutes } from './employees/routes';
import { CashRegisterRoutes } from './cash-registers/routes';
import { AuthRoutes } from './auth/routes';
import { ErrorMiddleware } from './middlewares';
export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    router.use('/api/v1/users', UserRoutes.routes);
    router.use('/api/v1/employees', EmployeeRoutes.routes);
    router.use('/api/v1/cash-registers', CashRegisterRoutes.routes);
    router.use('/api/v1/auth', AuthRoutes.routes);
    router.use(ErrorMiddleware.handleError); 

    return router;
  }
}