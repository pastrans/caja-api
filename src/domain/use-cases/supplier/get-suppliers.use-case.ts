import { PaginationDto } from '../../dtos';
import { SupplierEntity } from '../../entities';
import { SupplierRepository } from '../../repositories';
import { PaginatedResponse } from '../../interfaces/paginated-response.interface';
import { PaginationHelper } from '../../helpers/pagination.helper';

export interface GetSuppliersUseCase {
  execute(paginationDto: PaginationDto, search?: string): Promise<PaginatedResponse<SupplierEntity>>;
}

export class GetSuppliers implements GetSuppliersUseCase {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly path: string = '/api/v1/suppliers'
  ) {}

  async execute(paginationDto: PaginationDto, search?: string): Promise<PaginatedResponse<SupplierEntity>> {
    const { suppliers, total } = await this.repository.getAll(paginationDto, search);

    return PaginationHelper.createResponse<SupplierEntity>(
      suppliers,
      total,
      paginationDto,
      this.path
    );
  }
}
