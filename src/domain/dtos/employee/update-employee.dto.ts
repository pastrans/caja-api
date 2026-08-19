export class UpdateEmployeeDto {
  private constructor(
    public readonly id: number,
    public readonly name?: string,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly available?: boolean
  ) {}

  get values() {
    const returnObj: { [key: string]: any } = {};

    if (this.name !== undefined) returnObj.name = this.name;
    if (this.phone !== undefined) returnObj.phone = this.phone;
    if (this.address !== undefined) returnObj.address = this.address;
    if (this.available !== undefined) returnObj.available = this.available;

    return returnObj;
  }

  static create(props: { [key: string]: any }):[string, undefined] | [undefined, UpdateEmployeeDto]  {
    const { id, name, phone, address, available } = props;

    if (!id || isNaN(Number(id)) || Number(id) <= 0) {
      return ['id must be a valid positive number', undefined];
    }

    if (available !== undefined && typeof available !== 'boolean') {
      return ['available must be a boolean', undefined];
    }

    return [
      undefined,
      new UpdateEmployeeDto(
        Number(id),
        name?.trim(),
        phone?.trim(),
        address?.trim(),
        available
      ),
    ];
  }
}