import { Router } from 'express';
import { envs } from '../../config';
import { DashboardController } from './controller';
import {
  DashboardDatasourceImpl,
  DashboardRepositoryImpl,
  UserDatasourceImpl,
  UserRepositoryImpl,
} from '../../infrastructure';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class DashboardRoutes {
  static get routes(): Router {
    const router = Router();

    const dashboardRepository = new DashboardRepositoryImpl(new DashboardDatasourceImpl(envs.TIMEZONE));
    const controller = new DashboardController(dashboardRepository, envs.TIMEZONE);
    const userRepository = new UserRepositoryImpl(new UserDatasourceImpl());

    const requireAdmin = AuthMiddleware.validateJWT(userRepository, 'ADMIN');

    router.get('/summary', requireAdmin, controller.getSalesSummary);
    router.get('/sales-by-employee', requireAdmin, controller.getSalesByEmployee);
    router.get('/sales-over-time', requireAdmin, controller.getSalesOverTime);

    return router;
  }
}
