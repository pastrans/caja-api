import { CreateUserDto, UpdateUserDto, PaginationDto } from '../dtos';
import { UserEntity } from '../entities/user.entity';
import { UserPaginatedResult } from '../datasources/user.datasource';

export abstract class UserRepository {
  abstract create(createUserDto: CreateUserDto): Promise<UserEntity>;
  abstract getAll(paginationDto: PaginationDto): Promise<UserPaginatedResult>;
  abstract findById(id: number): Promise<UserEntity>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract updateById(updateUserDto: UpdateUserDto): Promise<UserEntity>;
  abstract deleteById(id: number): Promise<UserEntity>;
}