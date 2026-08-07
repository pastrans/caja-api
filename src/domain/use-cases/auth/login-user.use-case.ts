import { LoginUserDto } from '../../dtos';
import { UserEntity } from '../../entities';
import { UserRepository } from '../../repositories';
import { bcryptAdapter, JwtAdapter } from '../../../config';
import { CustomError } from '../../errors/custom.error';

export interface UserAuthResponse {
  token: string;
  user: UserEntity;
}

export interface LoginUserUseCase {
  execute(dto: LoginUserDto): Promise<UserAuthResponse>;
}

export class LoginUser implements LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly signToken: (payload: any, duration?: string) => Promise<string | null> = JwtAdapter.generateToken,
    private readonly comparePassword: (password: string, hashed: string) => boolean = bcryptAdapter.compare
  ) {}

  async execute(dto: LoginUserDto): Promise<UserAuthResponse> {
    // 1. Buscar usuario por email usando el UserRepository existente
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw CustomError.badRequest('Invalid credentials');

    // 2. Validar que la contraseña proporcionada sea correcta
    if (!user!.password || !this.comparePassword(dto.password, user!.password)) {
      throw CustomError.badRequest('Invalid credentials');
    }

    // 3. Generar token de sesión
    const token = await this.signToken({ id: user!.id, role: user!.role });
    if (!token) throw CustomError.badRequest('Error generating JWT'); 

    // Ocultar contraseña antes de retornar la entidad
    user!.password = undefined;

    return {
      token,
      user: user!,
    };
  }
}