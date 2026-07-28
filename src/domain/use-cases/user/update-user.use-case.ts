import { UpdateUserDto } from '../../dtos';
import { UserEntity } from '../../entities';
import { UserRepository } from '../../repositories';

export interface UpdateUserUseCase {
  execute(dto: UpdateUserDto): Promise<UserEntity>;
}

export class UpdateUser implements UpdateUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  execute(dto: UpdateUserDto): Promise<UserEntity> {
    return this.repository.updateById(dto);
  }
}