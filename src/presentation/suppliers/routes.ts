import { Router } from 'express';
import { SuppliersController } from './controller';
import { SupplierDatasourceImpl, SupplierRepositoryImpl, UserDatasourceImpl, UserRepositoryImpl } from '../../infrastructure';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class SupplierRoutes {
  static get routes(): Router {
    const router = Router();

    const supplierRepository = new SupplierRepositoryImpl(new SupplierDatasourceImpl());
    const controller = new SuppliersController(supplierRepository);
    const userRepository = new UserRepositoryImpl(new UserDatasourceImpl());

    const requireAdmin = AuthMiddleware.validateJWT(userRepository, 'ADMIN');

    // Los proveedores se crean y actualizan solo al importar DTE (no hay alta ni edición manual)
    router.get('/', requireAdmin, controller.getSuppliers);
    router.get('/:id', requireAdmin, controller.getSupplierById);

    return router;
  }
}
