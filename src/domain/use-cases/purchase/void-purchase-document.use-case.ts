import { VoidPurchaseDocumentDto } from '../../dtos';
import { PurchaseDocumentEntity } from '../../entities';
import { CustomError } from '../../errors/custom.error';
import { PurchaseDocumentRepository } from '../../repositories';
import { PurchaseVoidWarning } from '../../interfaces/purchase.interface';

export interface PurchaseDocumentVoidResult {
  document: PurchaseDocumentEntity;
  warnings: PurchaseVoidWarning[];
}

export interface VoidPurchaseDocumentUseCase {
  execute(dto: VoidPurchaseDocumentDto): Promise<PurchaseDocumentVoidResult>;
}

// Anular solo saca el documento de los reportes; no lo anula en Hacienda
export class VoidPurchaseDocument implements VoidPurchaseDocumentUseCase {
  constructor(private readonly repository: PurchaseDocumentRepository) {}

  async execute(dto: VoidPurchaseDocumentDto): Promise<PurchaseDocumentVoidResult> {
    const change = await this.repository.voidById(dto);
    if (change === 'not_found') throw CustomError.notFound(`Purchase document with id ${dto.id} not found`);
    if (change === 'invalid_state') throw CustomError.badRequest('Purchase document is already voided');

    const document = await this.repository.findById(dto.id);
    if (!document) throw CustomError.notFound(`Purchase document with id ${dto.id} not found`);

    // Sus notas de crédito siguen activas y siguen restando en los reportes
    const activeCreditNotes = (document.creditNotes ?? []).filter((creditNote) => !creditNote.voided);
    const warnings: PurchaseVoidWarning[] = activeCreditNotes.length > 0
      ? [{
          code: 'HAS_CREDIT_NOTES',
          message: `This crédito fiscal has ${activeCreditNotes.length} active credit note(s); they still count in reports unless voided too`,
        }]
      : [];

    return { document, warnings };
  }
}
