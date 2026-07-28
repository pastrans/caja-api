import { UserEntity } from '../../entities';
import { UserRepository } from '../../repositories';

export interface DeleteUserUseCase {
  execute(id: number): Promise<UserEntity>;
}

export class DeleteUser implements DeleteUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  execute(id: number): Promise<UserEntity> {
    return this.repository.deleteById(id);
  }
}