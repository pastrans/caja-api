export class UpdateUserDto {
  private constructor(
    public readonly id: number,
    public readonly name?: string,
    public readonly email?: string,
    public readonly password?: string,
    public readonly role?: string,
    public readonly available?: boolean
  ) {}

  get values() {
    const returnObj: { [key: string]: any } = {};

    if (this.name) returnObj.name = this.name;
    if (this.email) returnObj.email = this.email;
    if (this.password) returnObj.password = this.password;
    if (this.role) returnObj.role = this.role;
    if (this.available !== undefined) returnObj.available = this.available;

    return returnObj;
  }

  static create(props: { [key: string]: any }): [string, undefined]  | [undefined, UpdateUserDto] {
    const { id, name, email, password, role, available } = props;

    if (!id || isNaN(Number(id)) || Number(id) <= 0) {
      return ['id must be a valid positive number', undefined];
    }

    if (available !== undefined && typeof available !== 'boolean') {
      return ['available must be a boolean', undefined];
    }

    if (role && role !== 'ADMIN' && role !== 'CASHIER') {
      return ['role must be either ADMIN or CASHIER', undefined];
    }

    if (password && password.trim().length < 6) {
      return ['password must be at least 6 characters', undefined];
    }

    return [
      undefined,
      new UpdateUserDto(
        Number(id),
        name?.trim(),
        email?.trim()?.toLowerCase(),
        password,
        role,
        available
      ),
    ];
  }
}