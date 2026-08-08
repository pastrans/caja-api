import { CreateUserDto, UpdateUserDto, PaginationDto } from '../dtos';
import { UserEntity } from '../entities/user.entity';

export interface UserPaginatedResult {
  users: UserEntity[];
  total: number;
}

export abstract class UserDatasource {
  abstract create(createUserDto: CreateUserDto): Promise<UserEntity>;
  abstract getAll(paginationDto: PaginationDto): Promise<UserPaginatedResult>;
  abstract findById(id: number): Promise<UserEntity>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract updateById(updateUserDto: UpdateUserDto): Promise<UserEntity>;
  abstract deleteById(id: number): Promise<UserEntity>;
}