export class PaginationDto {
  static readonly MAX_LIMIT = 100;

  private constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly available?: boolean,
  ) {}

  static create(props: { page?: any; limit?: any; available?: any }): [undefined, PaginationDto] | [string, undefined] {
    const page = Number(props.page || 1);
    const limit = Number(props.limit || 10);

    if (!Number.isInteger(page) || page <= 0) return ['Page must be an integer greater than 0', undefined];
    if (!Number.isInteger(limit) || limit <= 0) return ['Limit must be an integer greater than 0', undefined];
    if (limit > PaginationDto.MAX_LIMIT) return [`Limit must be less than or equal to ${PaginationDto.MAX_LIMIT}`, undefined];

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