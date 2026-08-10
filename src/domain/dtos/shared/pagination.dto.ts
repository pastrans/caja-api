export class PaginationDto {
  private constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly available?: boolean,
  ) {}

  static create(props: { page?: any; limit?: any; available?: any }): [undefined, PaginationDto] | [string, undefined] {
    const page = Number(props.page || 1);
    const limit = Number(props.limit || 10);

    if (isNaN(page) || page <= 0) return ['Page must be a number greater than 0', undefined];
    if (isNaN(limit) || limit <= 0) return ['Limit must be a number greater than 0', undefined];

    // Mapeo flexible de booleano: 'true', true -> true | 'false', false -> false
    let isAvailable: boolean | undefined = undefined;
    if (props.available !== undefined) {
      if (props.available === 'true' || props.available === true) {
        isAvailable = true;
      } else if (props.available === 'false' || props.available === false) {
        isAvailable = false;
      } else {
        return ['Available must be a boolean value (true or false)', undefined];
      }
    }
    return [undefined, new PaginationDto(page, limit, isAvailable)];
  }
}