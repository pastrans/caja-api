import { MergeProductsDto } from '../../dtos';
import { PurchaseProductRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';
import { ProductKeyHelper } from '../../helpers/product-price.helper';
import { getProductSummaries } from './product-summaries';

export interface MergeProductsResult {
  key: string;      // Producto principal (si el pedido era una variante, su principal)
  variants: number; // Variantes que se unieron en esta operación
}

export interface MergeProductsUseCase {
  execute(dto: MergeProductsDto): Promise<MergeProductsResult>;
}

export class MergeProducts implements MergeProductsUseCase {
  constructor(private readonly repository: PurchaseProductRepository) {}

  async execute(dto: MergeProductsDto): Promise<MergeProductsResult> {
    // Solo se unen productos que existen (con al menos una compra registrada)
    const all = [dto.target, ...dto.variants];
    const summaries = await getProductSummaries(this.repository, dto.supplierId, all);
    const missing = all.filter((p) => !summaries.has(ProductKeyHelper.build(dto.supplierId, p.unitOfMeasure, p.ref)));
    if (missing.length > 0) {
      throw CustomError.badRequest(`Product not found: ${missing.map((p) => ProductKeyHelper.build(dto.supplierId, p.unitOfMeasure, p.ref)).join(', ')}`);
    }

    const main = await this.repository.mergeProducts(dto.supplierId, dto.target, dto.variants, dto.userId);

    return {
      key: ProductKeyHelper.build(dto.supplierId, main.unitOfMeasure, main.ref),
      variants: dto.variants.filter((v) => v.unitOfMeasure !== main.unitOfMeasure || v.ref !== main.ref).length,
    };
  }
}
