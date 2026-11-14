import { Request, Response, NextFunction } from 'express';
import {
  CustomError,
  GetPurchaseProductHistory,
  GetPurchaseProducts,
  PaginationDto,
  PurchaseProductHistoryDto,
  PurchaseProductRepository,
  PurchaseProductsDto,
} from '../../domain';

export class PurchaseProductsController {
  constructor(
    private readonly purchaseProductRepository: PurchaseProductRepository,
    private readonly timezone: string,
  ) {}

  public getProducts = (req: Request, res: Response, next: NextFunction) => {
    const [paginationError, paginationDto] = PaginationDto.create(req.query);
    if (paginationError) return next(CustomError.badRequest(paginationError));

    const [error, productsDto] = PurchaseProductsDto.create(req.query, this.timezone);
    if (error) return next(CustomError.badRequest(error));

    new GetPurchaseProducts(this.purchaseProductRepository, req.baseUrl)
      .execute(productsDto!, paginationDto!)
      .then((products) => res.json(products))
      .catch(next);
  };

  public getHistory = (req: Request, res: Response, next: NextFunction) => {
    const [error, historyDto] = PurchaseProductHistoryDto.create(req.query, this.timezone);
    if (error) return next(CustomError.badRequest(error));

    new GetPurchaseProductHistory(this.purchaseProductRepository)
      .execute(historyDto!)
      .then((history) => res.json(history))
      .catch(next);
  };
}
