import { Router } from 'express';
import { envs } from '../../config';
import { PurchaseProductsController } from './controller';
import {
  PurchaseProductDatasourceImpl,
  PurchaseProductRepositoryImpl,
  UserDatasourceImpl,
  UserRepositoryImpl,
} from '../../infrastructure';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class PurchaseProductRoutes {
  static get routes(): Router {
    const router = Router();

    const purchaseProductRepository = new PurchaseProductRepositoryImpl(new PurchaseProductDatasourceImpl());
    const controller = new PurchaseProductsController(purchaseProductRepository, envs.TIMEZONE);
    const userRepository = new UserRepositoryImpl(new UserDatasourceImpl());

    const requireAdmin = AuthMiddleware.validateJWT(userRepository, 'ADMIN');

    // Los productos se deducen de las líneas de los DTE importados (no hay catálogo ni edición manual).
    // El historial usa ?key= porque el código del producto puede traer espacios, '/' o ':'
    router.get('/', requireAdmin, controller.getProducts);
    router.get('/history', requireAdmin, controller.getHistory);
    router.get('/returns', requireAdmin, controller.getReturns); // Devoluciones del periodo (US-30)

    // Variantes: el mismo producto con otro código o nombre (US-26)
    router.get('/suggestions', requireAdmin, controller.getSuggestions);
    router.post('/suggestions/dismiss', requireAdmin, controller.dismissSuggestion);
    router.get('/merges', requireAdmin, controller.getMerges);
    router.post('/merges', requireAdmin, controller.merge);
    router.delete('/merges', requireAdmin, controller.unmerge); // ?key= de la variante

    return router;
  }
}
