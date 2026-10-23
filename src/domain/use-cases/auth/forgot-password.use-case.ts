import { UserRepository } from '../../repositories';
import { EmailService } from '../../../infrastructure';
import { bcryptAdapter, JwtAdapter, TokenPurpose } from '../../../config';

export interface ForgotPasswordUseCase {
  execute(email: string): Promise<void>;
}

export class ForgotPassword implements ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly frontendUrl: string
  ) {}

  // No revela si el email existe: el controlador responde siempre lo mismo
  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.available) return;

    // Token con expiración corta (15 minutos) y de un solo uso:
    // la huella del hash actual deja de coincidir en cuanto cambia la contraseña
    const resetToken = await JwtAdapter.generateToken(
      {
        id: user.id,
        purpose: TokenPurpose.RESET_PASSWORD,
        pwd: bcryptAdapter.fingerprint(user.password!),
      },
      '15m'
    );
    if (!resetToken) return;

    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const htmlBody = `
      <h1>Recuperación de contraseña</h1>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña. Este enlace expira en 15 minutos:</p>
      <a href="${resetLink}">Restablecer contraseña</a>
    `;

    // Sin await: el tiempo de respuesta no debe delatar si se envió un correo
    void this.emailService.sendEmail({
      to: user.email,
      subject: 'Restablecer contraseña',
      htmlBody,
    });
  }
}
