import {
  PurchaseDocumentRepository,
  PurchaseDocumentDatasource,
  PurchaseDocumentEntity,
  PurchaseDocumentFiltersDto,
  PurchaseDocumentPaginatedResult,
  PurchaseDocumentStateChange,
  CreatePurchaseDocumentResult,
  PaginationDto,
  ParsedDte,
  VoidPurchaseDocumentDto,
} from '../../domain';

export class PurchaseDocumentRepositoryImpl implements PurchaseDocumentRepository {
  constructor(private readonly datasource: PurchaseDocumentDatasource) {}

  findExistingGenerationCodes(generationCodes: string[]): Promise<string[]> {
    return this.datasource.findExistingGenerationCodes(generationCodes);
  }

  create(dte: ParsedDte, importedById: number): Promise<CreatePurchaseDocumentResult> {
    return this.datasource.create(dte, importedById);
  }

  getAll(paginationDto: PaginationDto, filters: PurchaseDocumentFiltersDto): Promise<PurchaseDocumentPaginatedResult> {
    return this.datasource.getAll(paginationDto, filters);
  }

  findById(id: number): Promise<PurchaseDocumentEntity | null> {
    return this.datasource.findById(id);
  }

  voidById(dto: VoidPurchaseDocumentDto): Promise<PurchaseDocumentStateChange> {
    return this.datasource.voidById(dto);
  }

  unvoidById(id: number): Promise<PurchaseDocumentStateChange> {
    return this.datasource.unvoidById(id);
  }
}
