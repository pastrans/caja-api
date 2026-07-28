import { prisma } from '../../data/postgres';
import {
  CashRegisterRecordDatasource,
  CashRegisterRecordEntity,
  TransactionRecordEntity,
  CashInOutRecordEntity,
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateTransactionDto,
  CreateCashInOutDto,
} from '../../domain';

export class CashRegisterRecordDatasourceImpl implements CashRegisterRecordDatasource {
  private readonly includeQuery = {
    opening: { include: { user: true } },
    closing: { include: { user: true } },
    transactions: { include: { employee: true } },
    cashInOut: true,
  };

  async open(openDto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity> {
    const active = await this.findActive();
    if (active) throw 'There is already an open cash register';

    const record = await prisma.cashRegisterRecord.create({
      data: {
        status: 'OPEN',
        opening: {
          create: {
            cash: openDto.cash,
            userId: openDto.userId,
            denominations: openDto.denominations as any,
            ...(openDto.note && { note: openDto.note }),
          },
        },
      },
      include: this.includeQuery,
    });

    return CashRegisterRecordEntity.fromObject(record);
  }

  async close(closeDto: CloseCashRegisterDto): Promise<CashRegisterRecordEntity> {
    const record = await this.findById(closeDto.cashRegisterRecordId);
    if (record.status === 'CLOSED') throw 'Cash register is already closed';

    const updated = await prisma.cashRegisterRecord.update({
      where: { id: closeDto.cashRegisterRecordId },
      data: {
        status: 'CLOSED',
        closing: {
          create: {
            cashProvided: closeDto.cashProvided,
            difference: closeDto.difference,
            userId: closeDto.userId,
            denominations: closeDto.denominations as any,
            ...(closeDto.note && { note: closeDto.note }),
          },
        },
      },
      include: this.includeQuery,
    });

    return CashRegisterRecordEntity.fromObject(updated);
  }

  async findActive(): Promise<CashRegisterRecordEntity | null> {
    const record = await prisma.cashRegisterRecord.findFirst({
      where: { status: 'OPEN' },
      include: this.includeQuery,
    });

    if (!record) return null;
    return CashRegisterRecordEntity.fromObject(record);
  }

  async findById(id: number): Promise<CashRegisterRecordEntity> {
    const record = await prisma.cashRegisterRecord.findUnique({
      where: { id },
      include: this.includeQuery,
    });

    if (!record) throw `Cash register record with id ${id} not found`;
    return CashRegisterRecordEntity.fromObject(record);
  }

  async getAll(): Promise<CashRegisterRecordEntity[]> {
    const records = await prisma.cashRegisterRecord.findMany({
      include: this.includeQuery,
      orderBy: { createdAt: 'desc' },
    });

    return records.map(CashRegisterRecordEntity.fromObject);
  }

  async createTransaction(dto: CreateTransactionDto): Promise<TransactionRecordEntity> {
    const cashRegister = await this.findById(dto.cashRegisterRecordId);
    if (cashRegister.status !== 'OPEN') throw 'Cannot register transaction on a closed cash register';

    const transaction = await prisma.transactionRecord.create({
      data: {
        cashRegisterRecordId: dto.cashRegisterRecordId,
        employeeId: dto.employeeId,
        amountToCharge: dto.amountToCharge,
        cashProvided: dto.cashProvided,
        changeReturned: dto.changeReturned,
        denominations: dto.denominations as any,
        ...(dto.note && { note: dto.note }),
      },
      include: { employee: true },
    });

    return TransactionRecordEntity.fromObject(transaction);
  }

  async createCashInOut(dto: CreateCashInOutDto): Promise<CashInOutRecordEntity> {
    const cashRegister = await this.findById(dto.cashRegisterRecordId);
    if (cashRegister.status !== 'OPEN') throw 'Cannot record cash movement on a closed cash register';

    const movement = await prisma.cashInOutRecord.create({
      data: {
        cashRegisterRecordId: dto.cashRegisterRecordId,
        type: dto.type,
        amount: dto.amount,
        reason: dto.reason,
        ...(dto.note && { note: dto.note }),
      },
    });

    return CashInOutRecordEntity.fromObject(movement);
  }
}