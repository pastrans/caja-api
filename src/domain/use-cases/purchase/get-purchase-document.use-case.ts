import { PurchaseDocumentEntity } from '../../entities';
import { CustomError } from '../../errors/custom.error';
import { PurchaseDocumentRepository } from '../../repositories';

export interface GetPurchaseDocumentUseCase {
  execute(id: number): Promise<PurchaseDocumentEntity>;
}

export class GetPurchaseDocument implements GetPurchaseDocumentUseCase {
  constructor(private readonly repository: PurchaseDocumentRepository) {}

  async execute(id: number): Promise<PurchaseDocumentEntity> {
    const document = await this.repository.findById(id);
    if (!document) {
      throw CustomError.notFound(`Purchase document with id ${id} not found`);
    }

    return document;
  }
}
