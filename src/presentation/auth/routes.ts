import { envs } from './../../config';
import { Router } from 'express';
import { AuthController } from './controller';
import { RateLimitMiddleware } from '../middlewares';
import { EmailService } from '../../infrastructure';
import { UserDatasourceImpl, UserRepositoryImpl } from '../../infrastructure';

const datasource = new UserDatasourceImpl();
const userRepository = new UserRepositoryImpl(datasource);

export class AuthRoutes {


  static get routes(): Router {

    const router = Router();

    const emailService = new EmailService({
      apiKey: envs.SENDGRID_API_KEY,
      mailerEmail: envs.MAILER_EMAIL,
      postToProvider: envs.SEND_EMAIL,
    });
    
    const controller = new AuthController(userRepository, emailService, envs.FRONTEND_URL);
    
    // Definir las rutas
    router.post('/login', RateLimitMiddleware.login, controller.loginUser );    
    router.post('/forgot-password', RateLimitMiddleware.forgotPassword, controller.forgotPassword )
    router.post('/reset-password/:token', controller.resetPassword )

    return router;
  }


}

