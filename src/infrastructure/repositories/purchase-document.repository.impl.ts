import {
  PurchaseDocumentRepository,
  PurchaseDocumentDatasource,
  CreatePurchaseDocumentResult,
  ParsedDte,
} from '../../domain';

export class PurchaseDocumentRepositoryImpl implements PurchaseDocumentRepository {
  constructor(private readonly datasource: PurchaseDocumentDatasource) {}

  findExistingGenerationCodes(generationCodes: string[]): Promise<string[]> {
    return this.datasource.findExistingGenerationCodes(generationCodes);
  }

  create(dte: ParsedDte, importedById: number): Promise<CreatePurchaseDocumentResult> {
    return this.datasource.create(dte, importedById);
  }
}
