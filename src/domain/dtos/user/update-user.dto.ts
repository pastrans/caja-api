export class UpdateUserDto {
  private constructor(
    public readonly id: number,
    public readonly name?: string,
    public readonly email?: string,
    public readonly password?: string,
    public readonly role?: 'ADMIN' | 'CASHIER'
  ) {}

  get values() {
    const returnObj: { [key: string]: any } = {};

    if (this.name) returnObj.name = this.name;
    if (this.email) returnObj.email = this.email;
    if (this.password) returnObj.password = this.password;
    if (this.role) returnObj.role = this.role;

    return returnObj;
  }

  static create(props: { [key: string]: any }): | [string, undefined]  | [undefined, UpdateUserDto]  {
    const { id, name, email, password, role } = props;

    if (!id || isNaN(Number(id))) {
      return ['id must be a valid number', undefined];
    }

    if (role && role !== 'ADMIN' && role !== 'CASHIER') {
      return ['Role must be either ADMIN or CASHIER', undefined];
    }

    return [undefined, new UpdateUserDto(Number(id), name, email, password, role)];
  }
}