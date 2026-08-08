export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  next: string | null;
  prev: string | null;
  data: T[];
}