export class PaginationDto {
  private constructor(
    public readonly page: number,
    public readonly limit: number,
  ) {}

  static create(props: { page?: any; limit?: any }): [undefined, PaginationDto] | [string, undefined]{
    const page = Number(props.page || 1);
    const limit = Number(props.limit || 10);

    if (isNaN(page) || page <= 0) return ['Page must be a number greater than 0', undefined];
    if (isNaN(limit) || limit <= 0) return ['Limit must be a number greater than 0', undefined];

    return [undefined, new PaginationDto(page, limit)];
  }
}