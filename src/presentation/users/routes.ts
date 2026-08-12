import { Router } from 'express';
import { UsersController } from './controller';
import { UserDatasourceImpl, UserRepositoryImpl } from '../../infrastructure';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const datasource = new UserDatasourceImpl();
const userRepository = new UserRepositoryImpl(datasource);
const userController = new UsersController(userRepository);

export class UserRoutes {
  static get routes(): Router {
    const router = Router();

    const userRepository = new UserRepositoryImpl(new UserDatasourceImpl());
    
    const requireAdmin = AuthMiddleware.validateJWT(userRepository,'ADMIN');
    const allowAllRoles = AuthMiddleware.validateJWT(userRepository, 'ADMIN', 'CASHIER');

    router.get('/', userController.getUsers);
    router.get('/:id', allowAllRoles, userController.getUserById);
    router.post('/', requireAdmin, userController.createUser);
    router.put('/:id', requireAdmin, userController.updateUser);
    router.delete('/:id', requireAdmin, userController.deleteUser);

    return router;
  }
}