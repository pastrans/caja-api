import { Request, Response, NextFunction } from 'express';
import {
  CustomError,
  DismissProductSuggestion,
  DismissProductSuggestionDto,
  GetProductMergeSuggestions,
  GetProductMerges,
  GetProductReturns,
  GetPurchaseProductHistory,
  GetPurchaseProducts,
  MergeProducts,
  MergeProductsDto,
  PaginationDto,
  ProductSupplierFilterDto,
  PurchaseProductHistoryDto,
  PurchaseProductRepository,
  PurchaseProductsDto,
  PurchaseReportDto,
  UnmergeProduct,
  UnmergeProductDto,
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

  // Rango como en los reportes de compras: sin fechas, el mes en curso
  public getReturns = (req: Request, res: Response, next: NextFunction) => {
    const [error, reportDto] = PurchaseReportDto.create(req.query, this.timezone);
    if (error) return next(CustomError.badRequest(error));

    new GetProductReturns(this.purchaseProductRepository)
      .execute(reportDto!)
      .then((report) => res.json(report))
      .catch(next);
  };

  public getSuggestions = (req: Request, res: Response, next: NextFunction) => {
    const [error, filterDto] = ProductSupplierFilterDto.create(req.query);
    if (error) return next(CustomError.badRequest(error));

    new GetProductMergeSuggestions(this.purchaseProductRepository)
      .execute(filterDto!)
      .then((suggestions) => res.json(suggestions))
      .catch(next);
  };

  public dismissSuggestion = (req: Request, res: Response, next: NextFunction) => {
    const [error, dismissDto] = DismissProductSuggestionDto.create({ ...req.body, userId: req.user!.id });
    if (error) return next(CustomError.badRequest(error));

    new DismissProductSuggestion(this.purchaseProductRepository)
      .execute(dismissDto!)
      .then(() => res.status(204).send())
      .catch(next);
  };

  public getMerges = (req: Request, res: Response, next: NextFunction) => {
    const [error, filterDto] = ProductSupplierFilterDto.create(req.query);
    if (error) return next(CustomError.badRequest(error));

    new GetProductMerges(this.purchaseProductRepository)
      .execute(filterDto!)
      .then((merges) => res.json(merges))
      .catch(next);
  };

  public merge = (req: Request, res: Response, next: NextFunction) => {
    const [error, mergeDto] = MergeProductsDto.create({ ...req.body, userId: req.user!.id });
    if (error) return next(CustomError.badRequest(error));

    new MergeProducts(this.purchaseProductRepository)
      .execute(mergeDto!)
      .then((result) => res.json(result))
      .catch(next);
  };

  public unmerge = (req: Request, res: Response, next: NextFunction) => {
    const [error, unmergeDto] = UnmergeProductDto.create(req.query);
    if (error) return next(CustomError.badRequest(error));

    new UnmergeProduct(this.purchaseProductRepository)
      .execute(unmergeDto!)
      .then(() => res.status(204).send())
      .catch(next);
  };
}
