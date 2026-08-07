import { Request, Response, NextFunction } from 'express';
import { CustomError, LoginUserDto, LoginUser, ForgotPassword, ResetPasswordDto, ResetPassword } from '../../domain';
import { UserRepository } from '../../domain/repositories'
import { EmailService } from '../../infrastructure';

export class AuthController {

  // DI
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly frontendUrl: string
  ) {}

  loginUser = (req: Request, res: Response, next: NextFunction) => {
    const [error, loginUserDto] = LoginUserDto.create(req.body);
    if (error) return next(CustomError.badRequest(error));
    new LoginUser(this.userRepository)
      .execute(loginUserDto!)
      .then((data) => res.json(data))
      .catch(next);
  };

  forgotPassword = (req: Request, res: Response, next: NextFunction) => {
      const { email } = req.body;
      if (!email) return next(CustomError.badRequest('Missing email'));

      new ForgotPassword(this.userRepository, this.emailService, this.frontendUrl)
        .execute(email)
        .then( (wasSent) =>
          res.json({
            message: wasSent
              ? 'Email was sent, check your inbox'
              : 'Email was not sent',
           }) )  
        .catch(next);
  }
  
  resetPassword = (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const { password } = req.body;
    const [error, resetPasswordDto] = ResetPasswordDto.create({ token, password });
    if (error)  return next(CustomError.badRequest(error));

    new ResetPassword(this.userRepository)
      .execute(resetPasswordDto!)
      .then((data) => res.json({ ok: data, message: 'Password updated successfully' }))
      .catch(next);
  };
  



}