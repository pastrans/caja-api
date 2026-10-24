import { CreatePurchaseDocumentResult, ParsedDte } from '../interfaces/purchase.interface';

export abstract class PurchaseDocumentDatasource {
  // Códigos de generación (de la lista) que ya están registrados
  abstract findExistingGenerationCodes(generationCodes: string[]): Promise<string[]>;
  // Guarda el documento, crea o actualiza su proveedor y vincula notas de crédito, todo en una transacción
  abstract create(dte: ParsedDte, importedById: number): Promise<CreatePurchaseDocumentResult>;
}
