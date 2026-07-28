export class CreateEmployeeDto {
  private constructor(public readonly name: string) {}

  static create(props: { [key: string]: any }): [string, undefined] | [undefined, CreateEmployeeDto] {
    const { name } = props;

    if (!name) return ['Employee name is required', undefined];

    return [undefined, new CreateEmployeeDto(name)];
  }
}