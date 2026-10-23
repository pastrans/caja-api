import { ResetPasswordDto, UpdateUserDto } from '../../dtos';
import { UserRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';
import { JwtAdapter, TokenPurpose, bcryptAdapter } from '../../../config';

export interface ResetPasswordUseCase {
  execute(dto: ResetPasswordDto): Promise<boolean>;
}

interface ResetTokenPayload {
  id: number;
  purpose: string;
  pwd: string;
}

export class ResetPassword implements ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly validateToken: <T>(token: string) => Promise<T | null> = JwtAdapter.validateToken,
    private readonly hashPassword: (password: string) => string = bcryptAdapter.hash,
    private readonly fingerprint: (hashed: string) => string = bcryptAdapter.fingerprint,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<boolean> {
    // 1. Validar y decodificar el JWT (solo se aceptan tokens de reset)
    const payload = await this.validateToken<ResetTokenPayload>(dto.token);
    if (!payload || !payload.id || payload.purpose !== TokenPurpose.RESET_PASSWORD) {
      throw CustomError.badRequest('Invalid or expired token');
    }

    // 2. Verificar que el usuario exista (findById lanza 404 si no existe)
    const user = await this.userRepository.findById(payload.id);

    // 3. El token es de un solo uso: si la contraseña ya cambió, la huella no coincide
    if (!user.available || payload.pwd !== this.fingerprint(user.password!)) {
      throw CustomError.badRequest('Invalid or expired token');
    }

    // 4. Hash de la nueva contraseña
    const hashedPassword = this.hashPassword(dto.password);

    // 5. Crear el DTO de actualización
    const [error, updateUserDto] = UpdateUserDto.create({
      id: user.id,
      password: hashedPassword,
    });

    if (error) throw CustomError.badRequest(error);

    // 6. Actualizar mediante el repositorio usando el DTO válido
    await this.userRepository.updateById(updateUserDto!);

    return true;
  }
}
