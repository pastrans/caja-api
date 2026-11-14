import { DteParser } from '../../helpers/dte-parser.helper';
import { ProductImportWarningsHelper } from '../../helpers/product-import-warnings.helper';
import { PurchaseDocumentRepository } from '../../repositories';
import {
  DteFile,
  DteWarning,
  ImportFileResult,
  ImportPurchaseDocumentsResult,
  ParsedDte,
} from '../../interfaces/purchase.interface';

export interface ImportPurchaseDocumentsUseCase {
  execute(files: DteFile[], importedById: number): Promise<ImportPurchaseDocumentsResult>;
}

interface PendingDocument {
  index: number;
  file: string;
  dte: ParsedDte;
}

// Importación parcial: cada archivo se valida y se guarda por separado (uno inválido no afecta a los demás)
export class ImportPurchaseDocuments implements ImportPurchaseDocumentsUseCase {
  constructor(
    private readonly repository: PurchaseDocumentRepository,
    private readonly receiverNrcs: string[]
  ) {}

  async execute(files: DteFile[], importedById: number): Promise<ImportPurchaseDocumentsResult> {
    const results: ImportFileResult[] = new Array(files.length);
    const pending: PendingDocument[] = [];

    // 1. Validar cada archivo
    files.forEach((file, index) => {
      if (!file.name.toLowerCase().endsWith('.json')) {
        results[index] = { file: file.name, status: 'rejected', reason: 'INVALID_FILE', message: 'Only .json files are accepted' };
        return;
      }

      const [rejection, dte] = DteParser.parse(file, this.receiverNrcs);
      if (rejection) {
        results[index] = { file: file.name, status: 'rejected', ...rejection };
        return;
      }

      pending.push({ index, file: file.name, dte: dte! });
    });

    // 2. Descartar duplicados: ya registrados o repetidos dentro de la misma carga
    const existing = new Set(await this.repository.findExistingGenerationCodes(pending.map(({ dte }) => dte.generationCode)));
    const seen = new Set<string>();
    const toSave = pending.filter(({ index, file, dte }) => {
      const code = dte.generationCode;
      if (existing.has(code)) {
        results[index] = this.duplicate(file, code);
        return false;
      }
      if (seen.has(code)) {
        results[index] = { file, status: 'rejected', reason: 'DUPLICATE', message: `Document ${code} is repeated in this upload` };
        return false;
      }
      seen.add(code);
      return true;
    });

    // 3. Guardar: primero los créditos fiscales, para que las notas de crédito de la misma carga se vinculen
    toSave.sort((a, b) => Number(a.dte.type === 'NOTA_CREDITO') - Number(b.dte.type === 'NOTA_CREDITO'));

    for (const { index, file, dte } of toSave) {
      results[index] = await this.save(file, dte, importedById);
    }

    return {
      summary: {
        received: files.length,
        imported: results.filter((result) => result.status === 'imported').length,
        rejected: results.filter((result) => result.status === 'rejected').length,
        withWarnings: results.filter((result) => result.status === 'imported' && result.warnings.length > 0).length,
      },
      results,
    };
  }

  private async save(file: string, dte: ParsedDte, importedById: number): Promise<ImportFileResult> {
    try {
      // Antes de guardar, para comparar con lo que ya se le había comprado al proveedor
      const history = await this.repository.getSupplierProductHistory(dte.supplier.nit, ProductImportWarningsHelper.productRefs(dte));
      const productWarnings = ProductImportWarningsHelper.compute(dte, history);

      const created = await this.repository.create(dte, importedById);
      // Otra carga simultánea pudo registrar el mismo documento
      if (created.status === 'duplicate') return this.duplicate(file, dte.generationCode);

      const pendingLinkWarnings: DteWarning[] = created.pendingLinks.map((code) => ({
        code: 'PENDING_LINK',
        message: `Related crédito fiscal ${code} is not registered yet; it will be linked when it is imported`,
      }));

      return {
        file,
        status: 'imported',
        documentId: created.id,
        type: dte.type,
        generationCode: dte.generationCode,
        linkedCreditNotes: created.linkedCreditNotes,
        warnings: [...dte.warnings, ...pendingLinkWarnings, ...productWarnings],
      };
    } catch (error) {
      console.error(`Error importing DTE ${dte.generationCode}:`, error);
      return { file, status: 'rejected', reason: 'INTERNAL_ERROR', message: 'Unexpected error while saving the document' };
    }
  }

  private duplicate(file: string, generationCode: string): ImportFileResult {
    return { file, status: 'rejected', reason: 'DUPLICATE', message: `Document ${generationCode} is already registered` };
  }
}
