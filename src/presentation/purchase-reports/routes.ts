import { Router } from 'express';
import { envs } from '../../config';
import { PurchaseReportsController } from './controller';
import {
  PurchaseReportDatasourceImpl,
  PurchaseReportRepositoryImpl,
  UserDatasourceImpl,
  UserRepositoryImpl,
} from '../../infrastructure';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class PurchaseReportRoutes {
  static get routes(): Router {
    const router = Router();

    const purchaseReportRepository = new PurchaseReportRepositoryImpl(new PurchaseReportDatasourceImpl());
    const controller = new PurchaseReportsController(purchaseReportRepository, envs.TIMEZONE);
    const userRepository = new UserRepositoryImpl(new UserDatasourceImpl());

    const requireAdmin = AuthMiddleware.validateJWT(userRepository, 'ADMIN');

    router.get('/iva-summary', requireAdmin, controller.getIvaSummary);
    router.get('/summary', requireAdmin, controller.getSummary);
    router.get('/by-supplier', requireAdmin, controller.getBySupplier);

    return router;
  }
}
