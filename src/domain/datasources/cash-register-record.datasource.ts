import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateTransactionDto,
  CreateCashInOutDto,
  PaginationDto,
} from '../dtos';
import {
  CashRegisterRecordEntity,
  TransactionRecordEntity,
  CashInOutRecordEntity,
} from '../entities';

// Reglas de negocio del cierre: se ejecutan con la caja bloqueada, dentro de la transacción.
// Si lanzan un error, el cierre se cancela.
export type CloseValidator = (record: CashRegisterRecordEntity) => void;

export interface CashRegisterPaginatedResult {
  records: CashRegisterRecordEntity[];
  total: number;
}

export abstract class CashRegisterRecordDatasource {
  abstract open(openDto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity>;
  abstract close(closeDto: CloseCashRegisterDto, validate: CloseValidator): Promise<CashRegisterRecordEntity>;
  abstract findActive(): Promise<CashRegisterRecordEntity | null>;
  abstract findById(id: number): Promise<CashRegisterRecordEntity>;
  abstract getAll(paginationDto: PaginationDto): Promise<CashRegisterPaginatedResult>; 
  abstract createTransaction(dto: CreateTransactionDto): Promise<TransactionRecordEntity>;
  abstract createCashInOut(dto: CreateCashInOutDto): Promise<CashInOutRecordEntity>;
}