import { bcryptAdapter } from "../../../config";

export class CreateUserDto {
  private constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly role?: 'ADMIN' | 'CASHIER'
  ) {}

  static create(props: { [key: string]: any }): [string, undefined] | [undefined, CreateUserDto] {
    const { name, email, password, role } = props;

    if (!name) return ['Name is required', undefined];
    if (!email) return ['Email is required', undefined];
    if (!password) return ['Password is required', undefined];
    if (password.length < 6)
      return ['Password must be at least 6 characters', undefined];
    
    let pass = bcryptAdapter.hash(password);

    if (role && role !== 'ADMIN' && role !== 'CASHIER') {
      return ['Role must be either ADMIN or CASHIER', undefined];
    }
    return [undefined, new CreateUserDto(name, email, pass , role)];
  }
}