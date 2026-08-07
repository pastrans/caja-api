export class ResetPasswordDto {
  private constructor(
    public readonly token: string,
    public readonly password: string,
  ) {}

  static create(props: { [key: string]: any }): [string, undefined]  | [undefined, ResetPasswordDto] {
    const { token, password } = props;

    if (!token) return ['Token is required', undefined];
    if (!password) return ['Password is required', undefined];
    if (password.length < 6) return ['Password must be at least 6 characters long', undefined];

    return [undefined, new ResetPasswordDto(token, password)];
  }
}