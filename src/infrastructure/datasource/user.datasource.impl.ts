import { prisma } from '../../data/postgres';
import {
  UserDatasource,
  UserEntity,
  CreateUserDto,
  UpdateUserDto,
  CustomError,
  PaginationDto,
  UserPaginatedResult,
} from '../../domain';

export class UserDatasourceImpl implements UserDatasource {
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { name, email, password, role } = createUserDto;
    
    const existingUser = await this.findByEmail(email);
    if (existingUser) throw CustomError.badRequest('User with this email already exists');

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        ...(role && { role }),
      },
    });

    return UserEntity.fromObject(user);
  }

  async getAll(paginationDto: PaginationDto): Promise<UserPaginatedResult> {
    const { page, limit } = paginationDto;

    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      total,
      users: users.map(UserEntity.fromObject),
    };
  }

  async findById(id: number): Promise<UserEntity> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw CustomError.notFound(`User with id ${id} not found`);

    return UserEntity.fromObject(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    return UserEntity.fromObject(user);
  }

  async updateById(updateUserDto: UpdateUserDto): Promise<UserEntity> {
    await this.findById(updateUserDto.id);

    const updatedUser = await prisma.user.update({
      where: { id: updateUserDto.id },
      data: updateUserDto.values,
    });

    return UserEntity.fromObject(updatedUser);
  }

  async deleteById(id: number): Promise<UserEntity> {
    await this.findById(id);

    const deleted = await prisma.user.delete({ where: { id } });
    return UserEntity.fromObject(deleted);
  }
}