import { UpdateUserDto } from '../../dtos';
import { UserEntity } from '../../entities';
import { UserRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';
import { bcryptAdapter } from '../../../config';

export interface UpdateUserUseCase {
  execute(dto: UpdateUserDto): Promise<UserEntity>;
}

export class UpdateUser implements UpdateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly hashPassword: (password: string) => string = bcryptAdapter.hash
  ) {}

  async execute(dto: UpdateUserDto): Promise<UserEntity> {
    // 1. Validar existencia del usuario
    const userExists = await this.repository.findById(dto.id);
    if (!userExists) {
      throw CustomError.notFound(`User with id ${dto.id} not found`);
    }

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