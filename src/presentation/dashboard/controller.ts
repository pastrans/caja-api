import { Request, Response, NextFunction } from 'express';
import {
  CustomError,
  DashboardRepository,
  GetSalesByEmployee,
  GetSalesOverTime,
  GetSalesSummary,
  SalesReportDto,
} from '../../domain';

export class DashboardController {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly timezone: string,
  ) {}

  public getSalesSummary = (req: Request, res: Response, next: NextFunction) => {
    new GetSalesSummary(this.dashboardRepository, this.timezone)
      .execute()
      .then((summary) => res.json(summary))
      .catch(next);
  };

  public getSalesByEmployee = (req: Request, res: Response, next: NextFunction) => {
    const [error, salesReportDto] = SalesReportDto.create(req.query, this.timezone);
    if (error) return next(CustomError.badRequest(error));

    new GetSalesByEmployee(this.dashboardRepository)
      .execute(salesReportDto!)
      .then((report) => res.json(report))
      .catch(next);
  };

  public getSalesOverTime = (req: Request, res: Response, next: NextFunction) => {
    const [error, salesReportDto] = SalesReportDto.create(req.query, this.timezone);
    if (error) return next(CustomError.badRequest(error));

    new GetSalesOverTime(this.dashboardRepository)
      .execute(salesReportDto!)
      .then((report) => res.json(report))
      .catch(next);
  };
}
