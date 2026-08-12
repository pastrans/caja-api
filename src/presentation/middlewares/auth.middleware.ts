import { Request, Response, NextFunction } from 'express';
import { JwtAdapter } from '../../config';
import { CustomError, UserRepository } from '../../domain';

export class AuthMiddleware {
  static validateJWT = (userRepository: UserRepository, ...validRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      // 1. Obtener y validar formato del header Authorization
      const authorization = req.header('Authorization');
      if (!authorization) {
        return next(CustomError.unauthorized('No token provided'));
      }

      if (!authorization.startsWith('Bearer ')) {
        return next(CustomError.unauthorized('Invalid Bearer token format'));
      }

      const token = authorization.split(' ')[1] || '';

      try {
        // 2. Decodificar y validar token JWT
        const payload = await JwtAdapter.validateToken<{ id: number }>(token);
        if (!payload) {
          return next(CustomError.unauthorized('Invalid or expired token'));
        }

        // 3. Verificar que el usuario exista en la BD
        const user = await userRepository.findById(payload.id);
        if (!user) {
          return next(CustomError.unauthorized('User not found'));
        }

        // 4. Verificar si el usuario está habilitado (available)
        if (!user.available) {
          return next(CustomError.unauthorized('User account is disabled'));
        }

        // 5. Validar roles (solo si se especificaron roles permitidos)
        if (validRoles.length > 0 && !validRoles.includes(user.role)) {
          return next(
            CustomError.forbidden(
              `User with role '${user.role}' is not authorized. Required: ${validRoles.join(', ')}`
            )
          );
        }

        // 6. Inyectar usuario en la petición y continuar
        req.body.user = user;
        next();
      } catch (error) {
        next(error);
      }
    };
  };
}