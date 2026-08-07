import { ResetPasswordDto, UpdateUserDto } from '../../dtos';
import { UserRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';
import { JwtAdapter, bcryptAdapter } from '../../../config';

export interface ResetPasswordUseCase {
  execute(dto: ResetPasswordDto): Promise<boolean>;
}

export class ResetPassword implements ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly validateToken: <T>(token: string) => Promise<T | null> = JwtAdapter.validateToken,
    private readonly hashPassword: (password: string) => string = bcryptAdapter.hash,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<boolean> {
    // 1. Validar y decodificar el JWT
    const payload = await this.validateToken<{ id: number }>(dto.token);
    if (!payload || !payload.id) {
      throw CustomError.badRequest('Invalid or expired token');
    }

    // 2. Verificar que el usuario exista
    const user = await this.userRepository.findById(payload.id);
    if (!user) {
      throw CustomError.notFound('User no longer exists');
    }

    // 3. Hash de la nueva contraseña
    const hashedPassword = this.hashPassword(dto.password);

    // 4. Crear el DTO de actualización
    const [error, updateUserDto] = UpdateUserDto.create({
      id: user.id,
      password: hashedPassword,
    });

    if (error) throw CustomError.badRequest(error);

    // 5. Actualizar mediante el repositorio usando el DTO válido
    await this.userRepository.updateById(updateUserDto!);

    return true;
  }
}