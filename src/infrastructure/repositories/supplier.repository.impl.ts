import {
  SupplierRepository,
  SupplierDatasource,
  SupplierEntity,
  PaginationDto,
  SupplierPaginatedResult,
} from '../../domain';

export class SupplierRepositoryImpl implements SupplierRepository {
  constructor(private readonly datasource: SupplierDatasource) {}

  getAll(paginationDto: PaginationDto, search?: string): Promise<SupplierPaginatedResult> {
    return this.datasource.getAll(paginationDto, search);
  }

  findById(id: number): Promise<SupplierEntity | null> {
    return this.datasource.findById(id);
  }
}
