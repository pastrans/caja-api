import { CreateUserDto } from '../../dtos';
import { UserEntity } from '../../entities';
import { UserRepository } from '../../repositories';
import { bcryptAdapter } from '../../../config';

export interface CreateUserUseCase {
  execute(dto: CreateUserDto): Promise<UserEntity>;
}

export class CreateUser implements CreateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly hashPassword: (password: string) => string = bcryptAdapter.hash // defalut value
  ) {}

  async execute(dto: CreateUserDto): Promise<UserEntity> {
    // 1. Encriptar la contraseña del DTO
    const hashedPassword = this.hashPassword(dto.password);

    // 2. Crear un DTO o payload con la contraseña encriptada
    const [_, dtoWithHashedPassword] = CreateUserDto.create({
      ...dto,
      password: hashedPassword,
    });

    // 3. Guardar en el repositorio y sanitizar la respuesta
    const user = await this.repository.create(dtoWithHashedPassword!);
    return user.sanitize();
  }
}