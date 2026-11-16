import { PaginationDto, PurchaseDocumentFiltersDto, VoidPurchaseDocumentDto } from '../dtos';
import { PurchaseDocumentEntity } from '../entities/purchase-document.entity';
import { PurchaseDocumentPaginatedResult, PurchaseDocumentStateChange, SupplierProductHistory } from '../datasources/purchase-document.datasource';
import { CreatePurchaseDocumentResult, ParsedDte } from '../interfaces/purchase.interface';

export abstract class PurchaseDocumentRepository {
  abstract findExistingGenerationCodes(generationCodes: string[]): Promise<string[]>;
  abstract create(dte: ParsedDte, importedById: number): Promise<CreatePurchaseDocumentResult>;
  abstract getAll(paginationDto: PaginationDto, filters: PurchaseDocumentFiltersDto): Promise<PurchaseDocumentPaginatedResult>;
  abstract findById(id: number): Promise<PurchaseDocumentEntity | null>;
  abstract voidById(dto: VoidPurchaseDocumentDto): Promise<PurchaseDocumentStateChange>;
  abstract unvoidById(id: number): Promise<PurchaseDocumentStateChange>;
  abstract getSupplierProductHistory(supplierNit: string, productRefs: string[]): Promise<SupplierProductHistory>;
}
