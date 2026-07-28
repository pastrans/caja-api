import { Request, Response } from 'express';
import {
  CashRegisterRecordRepository,
  CloseCashRegister,
  CloseCashRegisterDto,
  CreateCashInOut,
  CreateCashInOutDto,
  CreateTransaction,
  CreateTransactionDto,
  GetActiveCashRegister,
  GetCashRegister,
  GetCashRegisters,
  OpenCashRegister,
  OpenCashRegisterDto,
} from '../../domain';

export class CashRegistersController {
  constructor(private readonly cashRegisterRepository: CashRegisterRecordRepository) {}

  public openCashRegister = (req: Request, res: Response) => {
    const [error, openDto] = OpenCashRegisterDto.create(req.body);
    if (error) return res.status(400).json({ error });

    new OpenCashRegister(this.cashRegisterRepository)
      .execute(openDto!)
      .then((record) => res.json(record))
      .catch((error) => res.status(400).json({ error }));
  };

  public closeCashRegister = (req: Request, res: Response) => {
    const [error, closeDto] = CloseCashRegisterDto.create(req.body);
    if (error) return res.status(400).json({ error });

    new CloseCashRegister(this.cashRegisterRepository)
      .execute(closeDto!)
      .then((record) => res.json(record))
      .catch((error) => res.status(400).json({ error }));
  };

  public getActiveCashRegister = (req: Request, res: Response) => {
    new GetActiveCashRegister(this.cashRegisterRepository)
      .execute()
      .then((record) => res.json(record))
      .catch((error) => res.status(400).json({ error }));
  };

  public getCashRegisters = (req: Request, res: Response) => {
    new GetCashRegisters(this.cashRegisterRepository)
      .execute()
      .then((records) => res.json(records))
      .catch((error) => res.status(400).json({ error }));
  };

  public getCashRegisterById = (req: Request, res: Response) => {
    const id = +req.params.id!;

    new GetCashRegister(this.cashRegisterRepository)
      .execute(id)
      .then((record) => res.json(record))
      .catch((error) => res.status(400).json({ error }));
  };

  public createTransaction = (req: Request, res: Response) => {
    const [error, transactionDto] = CreateTransactionDto.create(req.body);
    if (error) return res.status(400).json({ error });

    new CreateTransaction(this.cashRegisterRepository)
      .execute(transactionDto!)
      .then((transaction) => res.json(transaction))
      .catch((error) => res.status(400).json({ error }));
  };

  public createCashInOut = (req: Request, res: Response) => {
    const [error, cashInOutDto] = CreateCashInOutDto.create(req.body);
    if (error) return res.status(400).json({ error });

    new CreateCashInOut(this.cashRegisterRepository)
      .execute(cashInOutDto!)
      .then((movement) => res.json(movement))
      .catch((error) => res.status(400).json({ error }));
  };
}