import { Request, Response, NextFunction } from 'express';
import { CustomError, LoginUserDto, LoginUser, ForgotPassword, ResetPasswordDto, ResetPassword, EmailSender } from '../../domain';
import { UserRepository } from '../../domain/repositories'
import { bcryptAdapter, JwtAdapter } from '../../config';

export class AuthController {

  // DI
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailSender: EmailSender,
    private readonly frontendUrl: string
  ) {}

  loginUser = (req: Request, res: Response, next: NextFunction) => {
    const [error, loginUserDto] = LoginUserDto.create(req.body);
    if (error) return next(CustomError.badRequest(error));
    new LoginUser(this.userRepository, JwtAdapter.generateToken, bcryptAdapter.compare)
      .execute(loginUserDto!)
      .then((data) => res.json(data))
      .catch(next);
  };

  forgotPassword = (req: Request, res: Response, next: NextFunction) => {
      const { email } = req.body;
      if (!email) return next(CustomError.badRequest('Missing email'));

      new ForgotPassword(this.userRepository, this.emailSender, this.frontendUrl, JwtAdapter.generateToken, bcryptAdapter.fingerprint)
        .execute(email)
        .then(() =>
          res.json({
            message: 'If the email is registered, you will receive a link to reset your password',
          }) )
        .catch(next);
  }
  
  resetPassword = (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const { password } = req.body;
    const [error, resetPasswordDto] = ResetPasswordDto.create({ token, password });
    if (error)  return next(CustomError.badRequest(error));

    new ResetPassword(this.userRepository, JwtAdapter.validateToken, bcryptAdapter.hash, bcryptAdapter.fingerprint)
      .execute(resetPasswordDto!)
      .then((data) => res.json({ ok: data, message: 'Password updated successfully' }))
      .catch(next);
  };
  



}