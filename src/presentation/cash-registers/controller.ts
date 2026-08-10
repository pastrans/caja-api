import { Request, Response, NextFunction } from 'express';
import {
  CashRegisterRecordRepository,
  CloseCashRegister,
  CloseCashRegisterDto,
  CreateCashInOut,
  CreateCashInOutDto,
  CreateTransaction,
  CreateTransactionDto,
  CustomError,
  GetActiveCashRegister,
  GetCashRegister,
  GetCashRegisters,
  OpenCashRegister,
  OpenCashRegisterDto,
  PaginationDto,
} from '../../domain';

export class CashRegistersController {
  constructor(private readonly cashRegisterRepository: CashRegisterRecordRepository) {}

  public openCashRegister = (req: Request, res: Response, next: NextFunction) => {
    const [error, openDto] = OpenCashRegisterDto.create(req.body);
    if (error) return next(CustomError.badRequest(error));

    new OpenCashRegister(this.cashRegisterRepository)
      .execute(openDto!)
      .then((record) => res.json(record))
      .catch(next);
  };

  public closeCashRegister = (req: Request, res: Response, next: NextFunction) => {
    const [error, closeDto] = CloseCashRegisterDto.create(req.body);
    if (error) return next(CustomError.badRequest(error));

    new CloseCashRegister(this.cashRegisterRepository)
      .execute(closeDto!)
      .then((record) => res.json(record))
      .catch(next);
  };

  public getActiveCashRegister = (req: Request, res: Response, next: NextFunction) => {
    new GetActiveCashRegister(this.cashRegisterRepository)
      .execute()
      .then((record) => res.json(record))
      .catch(next);
  };

  public getCashRegisters = (req: Request, res: Response, next: NextFunction) => {
    const [error, paginationDto] = PaginationDto.create(req.query);
    if (error) return next(CustomError.badRequest(error));

    new GetCashRegisters(this.cashRegisterRepository, req.baseUrl)
      .execute(paginationDto!)
      .then((records) => res.json(records))
      .catch(next);
  };

  public getCashRegisterById = (req: Request, res: Response, next: NextFunction) => {
    const id = +req.params.id!;
    if (isNaN(id)) return next(CustomError.badRequest('Invalid ID format'));

    new GetCashRegister(this.cashRegisterRepository)
      .execute(id)
      .then((record) => res.json(record))
      .catch(next);
  };

  public createTransaction = (req: Request, res: Response, next: NextFunction) => {
    const [error, transactionDto] = CreateTransactionDto.create(req.body);
    if (error) return next(CustomError.badRequest(error));

    new CreateTransaction(this.cashRegisterRepository)
      .execute(transactionDto!)
      .then((transaction) => res.json(transaction))
      .catch(next);
  };

  public createCashInOut = (req: Request, res: Response, next: NextFunction) => {
    const [error, cashInOutDto] = CreateCashInOutDto.create(req.body);
    if (error) return next(CustomError.badRequest(error));

    new CreateCashInOut(this.cashRegisterRepository)
      .execute(cashInOutDto!)
      .then((movement) => res.json(movement))
      .catch(next);
  };
}