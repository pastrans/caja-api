import { prisma } from '../../data/postgres';
import {
  UserDatasource,
  UserEntity,
  CreateUserDto,
  UpdateUserDto,
} from '../../domain';

export class UserDatasourceImpl implements UserDatasource {
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { name, email, password, role } = createUserDto;
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

  async getAll(): Promise<UserEntity[]> {
    const users = await prisma.user.findMany();
    return users.map(UserEntity.fromObject);
  }

  async findById(id: number): Promise<UserEntity> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw `User with id ${id} not found`;
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