import { PaginationDto, PurchaseDocumentFiltersDto } from '../../dtos';
import { PurchaseDocumentEntity } from '../../entities';
import { PurchaseDocumentRepository } from '../../repositories';
import { PaginatedResponse } from '../../interfaces/paginated-response.interface';
import { PaginationHelper } from '../../helpers/pagination.helper';

export interface GetPurchaseDocumentsUseCase {
  execute(paginationDto: PaginationDto, filters: PurchaseDocumentFiltersDto): Promise<PaginatedResponse<PurchaseDocumentEntity>>;
}

export class GetPurchaseDocuments implements GetPurchaseDocumentsUseCase {
  constructor(
    private readonly repository: PurchaseDocumentRepository,
    private readonly path: string = '/api/v1/purchase-documents'
  ) {}

  async execute(paginationDto: PaginationDto, filters: PurchaseDocumentFiltersDto): Promise<PaginatedResponse<PurchaseDocumentEntity>> {
    const { documents, total } = await this.repository.getAll(paginationDto, filters);

    return PaginationHelper.createResponse<PurchaseDocumentEntity>(
      documents,
      total,
      paginationDto,
      this.path
    );
  }
}
