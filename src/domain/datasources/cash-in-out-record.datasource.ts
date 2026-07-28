import { CreateCashInOutDto } from '../dtos';
import { CashInOutRecordEntity } from '../entities/cash-in-out.entity';

export abstract class CashInOutRecordDatasource {
  abstract create(createDto: CreateCashInOutDto): Promise<CashInOutRecordEntity>;
  abstract getByCashRegisterId(cashRegisterRecordId: number): Promise<CashInOutRecordEntity[]>;
  abstract findById(id: number): Promise<CashInOutRecordEntity>;
}