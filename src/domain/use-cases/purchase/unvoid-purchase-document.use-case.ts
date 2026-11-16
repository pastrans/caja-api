import { PurchaseDocumentEntity } from '../../entities';
import { CustomError } from '../../errors/custom.error';
import { PurchaseDocumentRepository } from '../../repositories';

export interface UnvoidPurchaseDocumentUseCase {
  execute(id: number): Promise<PurchaseDocumentEntity>;
}

export class UnvoidPurchaseDocument implements UnvoidPurchaseDocumentUseCase {
  constructor(private readonly repository: PurchaseDocumentRepository) {}

  async execute(id: number): Promise<PurchaseDocumentEntity> {
    const change = await this.repository.unvoidById(id);
    if (change === 'not_found') throw CustomError.notFound(`Purchase document with id ${id} not found`);
    if (change === 'invalid_state') throw CustomError.badRequest('Purchase document is not voided');

    const document = await this.repository.findById(id);
    if (!document) throw CustomError.notFound(`Purchase document with id ${id} not found`);

    return document;
  }
}
