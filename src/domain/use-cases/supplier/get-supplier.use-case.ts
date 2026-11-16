import { SupplierEntity } from '../../entities';
import { CustomError } from '../../errors/custom.error';
import { SupplierRepository } from '../../repositories';

export interface GetSupplierUseCase {
  execute(id: number): Promise<SupplierEntity>;
}

export class GetSupplier implements GetSupplierUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  async execute(id: number): Promise<SupplierEntity> {
    const supplier = await this.repository.findById(id);
    if (!supplier) {
      throw CustomError.notFound(`Supplier with id ${id} not found`);
    }

    return supplier;
  }
}
