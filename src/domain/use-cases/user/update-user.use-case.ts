import { UpdateUserDto } from '../../dtos';
import { UserEntity } from '../../entities';
import { UserRepository } from '../../repositories';
import { HashPassword } from '../../interfaces/auth-adapters.interface';

export interface UpdateUserUseCase {
  execute(dto: UpdateUserDto): Promise<UserEntity>;
}

export class UpdateUser implements UpdateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly hashPassword: HashPassword
  ) {}

  async execute(dto: UpdateUserDto): Promise<UserEntity> {
    // 1. Validar existencia del usuario (findById lanza 404 si no existe)
    await this.repository.findById(dto.id);

    // 2. Hashear contraseña solo si fue provista
    let password = dto.password;
    if (password) {
      password = this.hashPassword(password);
    }

    // 3. Crear DTO con password hasheado preservando available y demás campos
    const [, dtoToUpdate] = UpdateUserDto.create({
      ...dto,
      password,
    });

    // 4. Actualizar y sanitizar
    const updatedUser = await this.repository.updateById(dtoToUpdate!);
    return updatedUser.sanitize();
  }
}