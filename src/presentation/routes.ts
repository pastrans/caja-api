import { Router } from 'express';
import { UserRoutes } from './users/routes';
import { EmployeeRoutes } from './employees/routes';
import { CashRegisterRoutes } from './cash-registers/routes';
import { AuthRoutes } from './auth/routes';
import { DashboardRoutes } from './dashboard/routes';
import { SupplierRoutes } from './suppliers/routes';
import { PurchaseDocumentRoutes } from './purchase-documents/routes';
import { PurchaseReportRoutes } from './purchase-reports/routes';
import { PurchaseProductRoutes } from './purchase-products/routes';
export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    router.use('/api/v1/users', UserRoutes.routes);
    router.use('/api/v1/employees', EmployeeRoutes.routes);
    router.use('/api/v1/cash-registers', CashRegisterRoutes.routes);
    router.use('/api/v1/auth', AuthRoutes.routes);
    router.use('/api/v1/dashboard', DashboardRoutes.routes);
    router.use('/api/v1/suppliers', SupplierRoutes.routes);
    router.use('/api/v1/purchase-documents', PurchaseDocumentRoutes.routes);
    router.use('/api/v1/purchase-reports', PurchaseReportRoutes.routes);
    router.use('/api/v1/purchase-products', PurchaseProductRoutes.routes);

    // Cualquier ruta /api sin coincidencia responde 404 en JSON (no el index.html de la SPA)
    router.use('/api', (req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    return router;
  }
}