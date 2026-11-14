import { UnmergeProductDto } from '../../dtos';
import { PurchaseProductRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';

export interface UnmergeProductUseCase {
  execute(dto: UnmergeProductDto): Promise<void>;
}

// La variante vuelve a ser un producto propio con su historial
export class UnmergeProduct implements UnmergeProductUseCase {
  constructor(private readonly repository: PurchaseProductRepository) {}

  async execute(dto: UnmergeProductDto): Promise<void> {
    const removed = await this.repository.unmergeVariant(dto.supplierId, dto.variant);
    if (!removed) throw CustomError.notFound('This product is not a variant of another product');
  }
}
