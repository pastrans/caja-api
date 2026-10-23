import { Router } from 'express';
import { UserRoutes } from './users/routes';
import { EmployeeRoutes } from './employees/routes';
import { CashRegisterRoutes } from './cash-registers/routes';
import { AuthRoutes } from './auth/routes';
import { DashboardRoutes } from './dashboard/routes';
export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    router.use('/api/v1/users', UserRoutes.routes);
    router.use('/api/v1/employees', EmployeeRoutes.routes);
    router.use('/api/v1/cash-registers', CashRegisterRoutes.routes);
    router.use('/api/v1/auth', AuthRoutes.routes);
    router.use('/api/v1/dashboard', DashboardRoutes.routes);

    // Cualquier ruta /api sin coincidencia responde 404 en JSON (no el index.html de la SPA)
    router.use('/api', (req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    return router;
  }
}