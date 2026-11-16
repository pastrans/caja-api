import { PaginationDto } from '../dtos';
import { SupplierEntity } from '../entities/supplier.entity';

export interface SupplierPaginatedResult {
  suppliers: SupplierEntity[];
  total: number;
}

export abstract class SupplierDatasource {
  abstract getAll(paginationDto: PaginationDto, search?: string): Promise<SupplierPaginatedResult>;
  abstract findById(id: number): Promise<SupplierEntity | null>;
}
