import { PaginationDto } from '../dtos/shared/pagination.dto';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';

export class PaginationHelper {
  static createResponse<T>(
    items: T[],
    total: number,
    paginationDto: PaginationDto,
    endpoint: string,
  ): PaginatedResponse<T> {
    const { page, limit } = paginationDto;
    const totalPages = Math.ceil(total / limit);

    const next =
      page < totalPages
        ? `${endpoint}?page=${page + 1}&limit=${limit}`
        : null;

    const prev =
      page - 1 > 0
        ? `${endpoint}?page=${page - 1}&limit=${limit}`
        : null;

    return {
      page,
      limit,
      total,
      next,
      prev,
      data: items,
    };
  }
}