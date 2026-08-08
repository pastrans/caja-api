import {
  UserRepository,
  UserDatasource,
  UserEntity,
  CreateUserDto,
  UpdateUserDto,
  PaginationDto,
  UserPaginatedResult,
} from '../../domain';

export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly datasource: UserDatasource) {}

  create(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.datasource.create(createUserDto);
  }

  getAll(paginationDto: PaginationDto): Promise<UserPaginatedResult> {
    return this.datasource.getAll(paginationDto);
  }

  findById(id: number): Promise<UserEntity> {
    return this.datasource.findById(id);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.datasource.findByEmail(email);
  }

  updateById(updateUserDto: UpdateUserDto): Promise<UserEntity> {
    return this.datasource.updateById(updateUserDto);
  }

  deleteById(id: number): Promise<UserEntity> {
    return this.datasource.deleteById(id);
  }
}