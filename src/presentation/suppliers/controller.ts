import { Request, Response, NextFunction } from 'express';
import { CustomError, GetSupplier, GetSuppliers, PaginationDto, SupplierRepository } from '../../domain';

export class SuppliersController {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  public getSuppliers = (req: Request, res: Response, next: NextFunction) => {
    const [error, paginationDto] = PaginationDto.create(req.query);
    if (error) return next(CustomError.badRequest(error));

    const { search } = req.query;
    if (search !== undefined && typeof search !== 'string') return next(CustomError.badRequest('search must be a string'));

    new GetSuppliers(this.supplierRepository, req.baseUrl)
      .execute(paginationDto!, search?.trim() || undefined)
      .then((suppliers) => res.json(suppliers))
      .catch(next);
  };

  public getSupplierById = (req: Request, res: Response, next: NextFunction) => {
    const id = +req.params.id!;
    if (isNaN(id)) return next(CustomError.badRequest('Invalid ID format'));

    new GetSupplier(this.supplierRepository)
      .execute(id)
      .then((supplier) => res.json(supplier))
      .catch(next);
  };
}
