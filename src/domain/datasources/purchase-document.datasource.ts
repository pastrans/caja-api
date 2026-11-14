import { PaginationDto, PurchaseDocumentFiltersDto, VoidPurchaseDocumentDto } from '../dtos';
import { PurchaseDocumentEntity } from '../entities/purchase-document.entity';
import { CreatePurchaseDocumentResult, ParsedDte } from '../interfaces/purchase.interface';

export interface PurchaseDocumentPaginatedResult {
  documents: PurchaseDocumentEntity[];
  total: number;
}

// Lo que ya se le compró a un proveedor, para avisar al importar si sus productos cambian de formato o de unidad
export interface SupplierProductHistory {
  lines: number;               // Líneas de todos sus documentos
  describedCodeLines: number;  // Líneas con el código del producto al inicio de la descripción
  units: Record<string, { unit: number; lines: number }[]>; // Cuántas líneas de cada código pedido hubo en cada unidad (créditos fiscales)
}

// Resultado de anular/reactivar: el cambio se aplica solo si el documento está en el estado esperado
export type PurchaseDocumentStateChange = 'updated' | 'not_found' | 'invalid_state';

export abstract class PurchaseDocumentDatasource {
  // Códigos de generación (de la lista) que ya están registrados
  abstract findExistingGenerationCodes(generationCodes: string[]): Promise<string[]>;
  // Guarda el documento, crea o actualiza su proveedor y vincula notas de crédito, todo en una transacción
  abstract create(dte: ParsedDte, importedById: number): Promise<CreatePurchaseDocumentResult>;
  abstract getAll(paginationDto: PaginationDto, filters: PurchaseDocumentFiltersDto): Promise<PurchaseDocumentPaginatedResult>;
  // Detalle: incluye líneas, documentos relacionados y notas de crédito
  abstract findById(id: number): Promise<PurchaseDocumentEntity | null>;
  abstract voidById(dto: VoidPurchaseDocumentDto): Promise<PurchaseDocumentStateChange>;
  abstract unvoidById(id: number): Promise<PurchaseDocumentStateChange>;
  // productRefs: códigos de producto del documento que se está importando
  abstract getSupplierProductHistory(supplierNit: string, productRefs: string[]): Promise<SupplierProductHistory>;
}
