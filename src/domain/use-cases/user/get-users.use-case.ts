import { PaginationDto } from '../../dtos';
import { UserEntity } from '../../entities';
import { UserRepository } from '../../repositories';
import { PaginatedResponse } from '../../interfaces/paginated-response.interface';
import { PaginationHelper } from '../../helpers/pagination.helper';

export interface GetUsersUseCase {
  execute(paginationDto: PaginationDto): Promise<PaginatedResponse<UserEntity>>;
}

export class GetUsers implements GetUsersUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly path: string = '/api/users'
  ) {}

  async execute(paginationDto: PaginationDto): Promise<PaginatedResponse<UserEntity>> {
    const { users, total } = await this.repository.getAll(paginationDto);

    // Ocultar contraseñas
    const sanitizedUsers = users.map((user) => {
      user.password = undefined;
      return user;
    });

    return PaginationHelper.createResponse<UserEntity>(
      sanitizedUsers,
      total,
      paginationDto,
      this.path
    );
  }
}