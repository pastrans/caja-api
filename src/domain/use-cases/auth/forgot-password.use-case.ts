import { UserRepository } from '../../repositories';
import { EmailSender } from '../../interfaces/email-sender.interface';
import { PasswordFingerprint, SignToken, TokenPurpose } from '../../interfaces/auth-adapters.interface';

export interface ForgotPasswordUseCase {
  execute(email: string): Promise<void>;
}

export class ForgotPassword implements ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailSender: EmailSender,
    private readonly frontendUrl: string,
    private readonly signToken: SignToken,
    private readonly fingerprint: PasswordFingerprint
  ) {}

  // No revela si el email existe: el controlador responde siempre lo mismo
  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.available) return;

    // Token con expiración corta (15 minutos) y de un solo uso:
    // la huella del hash actual deja de coincidir en cuanto cambia la contraseña
    const resetToken = await this.signToken(
      {
        id: user.id,
        purpose: TokenPurpose.RESET_PASSWORD,
        pwd: this.fingerprint(user.password!),
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
    void this.emailSender.sendEmail({
      to: user.email,
      subject: 'Restablecer contraseña',
      htmlBody,
    });
  }
}
