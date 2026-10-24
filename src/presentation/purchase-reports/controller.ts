import { Request, Response, NextFunction } from 'express';
import {
  CustomError,
  GetPurchaseIvaSummary,
  GetPurchasesBySupplier,
  GetPurchaseSummary,
  PurchaseReportDto,
  PurchaseReportRepository,
  PurchaseYearReportDto,
} from '../../domain';

export class PurchaseReportsController {
  constructor(
    private readonly purchaseReportRepository: PurchaseReportRepository,
    private readonly timezone: string,
  ) {}

  public getIvaSummary = (req: Request, res: Response, next: NextFunction) => {
    const [error, yearReportDto] = PurchaseYearReportDto.create(req.query, this.timezone);
    if (error) return next(CustomError.badRequest(error));

    new GetPurchaseIvaSummary(this.purchaseReportRepository)
      .execute(yearReportDto!)
      .then((report) => res.json(report))
      .catch(next);
  };

  public getSummary = (req: Request, res: Response, next: NextFunction) => {
    const [error, reportDto] = PurchaseReportDto.create(req.query, this.timezone);
    if (error) return next(CustomError.badRequest(error));

    new GetPurchaseSummary(this.purchaseReportRepository)
      .execute(reportDto!)
      .then((report) => res.json(report))
      .catch(next);
  };

  public getBySupplier = (req: Request, res: Response, next: NextFunction) => {
    const [error, reportDto] = PurchaseReportDto.create(req.query, this.timezone);
    if (error) return next(CustomError.badRequest(error));

    new GetPurchasesBySupplier(this.purchaseReportRepository)
      .execute(reportDto!)
      .then((report) => res.json(report))
      .catch(next);
  };
}
