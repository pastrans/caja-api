import { PaginationDto } from '../dtos';
import { SupplierEntity } from '../entities/supplier.entity';
import { SupplierPaginatedResult } from '../datasources/supplier.datasource';

export abstract class SupplierRepository {
  abstract getAll(paginationDto: PaginationDto, search?: string): Promise<SupplierPaginatedResult>;
  abstract findById(id: number): Promise<SupplierEntity | null>;
}
