export class UserEntity {
  constructor(
    public id: number,
    public name: string,
    public email: string,
    public role: 'ADMIN' | 'CASHIER',
    public password?: string,
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}
  
  public sanitize(): UserEntity {
    this.password = undefined;
    return this;
  }

  public static fromObject(object: { [key: string]: any }): UserEntity {
    const { id, name, email, password, role, createdAt, updatedAt } = object;

    if (!id) throw 'User ID is required';
    if (!name) throw 'User name is required';
    if (!email) throw 'User email is required';

    return new UserEntity(
      Number(id),
      name,
      email,
      role ?? 'CASHIER',
      password,
      createdAt ? new Date(createdAt) : undefined,
      updatedAt ? new Date(updatedAt) : undefined
    );
  }
}