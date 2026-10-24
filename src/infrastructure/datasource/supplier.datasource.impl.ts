import { Prisma } from '@prisma/client';
import { prisma } from '../../data/postgres';
import { SupplierDatasource, SupplierEntity, PaginationDto, SupplierPaginatedResult } from '../../domain';

export class SupplierDatasourceImpl implements SupplierDatasource {
  async getAll(paginationDto: PaginationDto, search?: string): Promise<SupplierPaginatedResult> {
    const { page, limit } = paginationDto;

    // Búsqueda por nombre, nombre comercial o NIT
    const where: Prisma.SupplierWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { commercialName: { contains: search, mode: 'insensitive' } },
            { nit: { contains: search } },
          ],
        }
      : {};

    const [total, suppliers] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      total,
      suppliers: suppliers.map(SupplierEntity.fromObject),
    };
  }

  async findById(id: number): Promise<SupplierEntity | null> {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return null;
    return SupplierEntity.fromObject(supplier);
  }
}
