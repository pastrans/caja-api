import {
  CashRegisterRecordRepository,
  CashRegisterRecordDatasource,
  CashRegisterRecordEntity,
  TransactionRecordEntity,
  CashInOutRecordEntity,
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateTransactionDto,
  CreateCashInOutDto,
  PaginationDto,
  CashRegisterPaginatedResult,
} from '../../domain';

export class CashRegisterRecordRepositoryImpl implements CashRegisterRecordRepository {
  constructor(private readonly datasource: CashRegisterRecordDatasource) {}

  open(openDto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity> {
    return this.datasource.open(openDto);
  }

  close(closeDto: CloseCashRegisterDto): Promise<CashRegisterRecordEntity> {
    return this.datasource.close(closeDto);
  }

  findActive(): Promise<CashRegisterRecordEntity | null> {
    return this.datasource.findActive();
  }

  findById(id: number): Promise<CashRegisterRecordEntity> {
    return this.datasource.findById(id);
  }

  getAll(paginationDto: PaginationDto): Promise<CashRegisterPaginatedResult> {
    return this.datasource.getAll(paginationDto);
  }

  createTransaction(dto: CreateTransactionDto): Promise<TransactionRecordEntity> {
    return this.datasource.createTransaction(dto);
  }

  createCashInOut(dto: CreateCashInOutDto): Promise<CashInOutRecordEntity> {
    return this.datasource.createCashInOut(dto);
  }
}