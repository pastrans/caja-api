import { UserEntity } from '../domain/entities/user.entity';

// Usuario autenticado que AuthMiddleware deja en la petición
declare global {
  namespace Express {
    interface Request {
      user?: UserEntity;
    }
  }
}

export {};
