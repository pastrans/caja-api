import { envs } from './../../config';
import { Router } from 'express';
import { AuthController } from './controller';
import { EmailService } from '../../infrastructure';
import { UserDatasourceImpl, UserRepositoryImpl } from '../../infrastructure';

const datasource = new UserDatasourceImpl();
const userRepository = new UserRepositoryImpl(datasource);

export class AuthRoutes {


  static get routes(): Router {

    const router = Router();

    const emailService = new EmailService(
      envs.MAILER_SERVICE,
      envs.MAILER_EMAIL,
      envs.MAILER_SECRET_KEY,
      envs.SEND_EMAIL,
    );
    
    const controller = new AuthController(userRepository, emailService, envs.FRONTEND_URL);
    
    // Definir las rutas
    router.post('/login', controller.loginUser );    
    router.post('/forgot-password', controller.forgotPassword )
    router.post('/reset-password/:token', controller.resetPassword )

    return router;
  }


}

