import { UserRepository } from '../../repositories';
import { EmailService } from '../../../infrastructure';
import { JwtAdapter } from '../../../config';
import { CustomError } from '../../errors/custom.error';

export interface ForgotPasswordUseCase {
  execute(email: string): Promise<boolean>;
}

export class ForgotPassword implements ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly frontendUrl: string
  ) {}

  async execute(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw CustomError.badRequest('User with this email does not exist'); 

    // Token con expiración corta (ej: 15 minutos)
    const resetToken = await JwtAdapter.generateToken({ id: user.id }, '15m');
    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const htmlBody = `
      <h1>Recuperación de contraseña</h1>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña. Este enlace expira en 15 minutos:</p>
      <a href="${resetLink}">Restablecer contraseña</a>
    `;

    return await this.emailService.sendEmail({
      to: user.email,
      subject: 'Restablecer contraseña',
      htmlBody,
    });
  }
}