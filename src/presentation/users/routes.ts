import { Router } from 'express';
import { UsersController } from './controller';
import { UserDatasourceImpl, UserRepositoryImpl } from '../../infrastructure';

const datasource = new UserDatasourceImpl();
const userRepository = new UserRepositoryImpl(datasource);
const userController = new UsersController(userRepository);

export class UserRoutes {
  static get routes(): Router {
    const router = Router();

    router.get('/', userController.getUsers);
    router.get('/:id', userController.getUserById);
    router.post('/', userController.createUser);
    router.put('/:id', userController.updateUser);
    router.delete('/:id', userController.deleteUser);

    return router;
  }
}