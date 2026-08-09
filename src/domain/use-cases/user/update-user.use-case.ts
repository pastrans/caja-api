import { UpdateUserDto } from '../../dtos';
import { UserEntity } from '../../entities';
import { UserRepository } from '../../repositories';
import { bcryptAdapter } from '../../../config';

export interface UpdateUserUseCase {
  execute(dto: UpdateUserDto): Promise<UserEntity>;
}

export class UpdateUser implements UpdateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly hashPassword: (password: string) => string = bcryptAdapter.hash // defalut value
  ) {}

  async execute(dto: UpdateUserDto): Promise<UserEntity> {
    let password = dto.password;

    // Solo encriptar si el cliente envió una contraseña para actualizar
    if (password) {
      password = this.hashPassword(password);
    }

    const [_, dtoToUpdate] = UpdateUserDto.create({
      ...dto,
      password,
    });

    const user = await this.repository.updateById(dtoToUpdate!);
    return user.sanitize();
  }
}