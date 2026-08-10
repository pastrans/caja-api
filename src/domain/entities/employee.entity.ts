export class EmployeeEntity {
  constructor(
    public id: number,
    public name: string,
    public available: boolean = true,
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}

  public static fromObject(object: { [key: string]: any }): EmployeeEntity {
    const { id, name, available, createdAt, updatedAt } = object;

    if (!id) throw 'Employee ID is required';
    if (!name) throw 'Employee name is required';

    return new EmployeeEntity(
      Number(id),
      name,
      available ?? true,
      createdAt ? new Date(createdAt) : undefined,
      updatedAt ? new Date(updatedAt) : undefined
    );
  }
}