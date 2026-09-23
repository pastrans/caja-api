// src/@types/express.d.ts
import { UserEntity } from '../domain/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: UserEntity;
    }
  }
}