import { DismissProductSuggestionDto } from '../../dtos';
import { PurchaseProductRepository } from '../../repositories';

export interface DismissProductSuggestionUseCase {
  execute(dto: DismissProductSuggestionDto): Promise<void>;
}

// Guarda que esos productos no son el mismo, para no volver a sugerirlos
export class DismissProductSuggestion implements DismissProductSuggestionUseCase {
  constructor(private readonly repository: PurchaseProductRepository) {}

  execute(dto: DismissProductSuggestionDto): Promise<void> {
    return this.repository.dismissSuggestion(dto.supplierId, dto.signature, dto.userId);
  }
}
