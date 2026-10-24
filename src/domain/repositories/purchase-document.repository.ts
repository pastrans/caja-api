import { CreatePurchaseDocumentResult, ParsedDte } from '../interfaces/purchase.interface';

export abstract class PurchaseDocumentRepository {
  abstract findExistingGenerationCodes(generationCodes: string[]): Promise<string[]>;
  abstract create(dte: ParsedDte, importedById: number): Promise<CreatePurchaseDocumentResult>;
}
