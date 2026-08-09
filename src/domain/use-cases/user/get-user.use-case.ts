import { UserEntity } from '../../entities';
import { UserRepository } from '../../repositories';

export interface GetUserUseCase {
  execute(id: number): Promise<UserEntity>;
}

export class GetUser implements GetUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(id: number): Promise<UserEntity> {
    const user = await this.repository.findById(id);
    return user.sanitize();
  }
}