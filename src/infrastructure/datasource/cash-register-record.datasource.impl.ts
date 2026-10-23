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
  CustomError,
  PaginationDto,
  CashRegisterPaginatedResult,
  CashRegisterSummary,
} from '../../domain';

export class CashRegisterRecordDatasourceImpl implements CashRegisterRecordDatasource {
  private readonly includeQuery = {
    opening: { include: { user: true } },
    closing: { include: { user: true } },
    transactions: { include: { employee: true } },
    cashInOut: true,
  };

  // Para listados: sin el detalle de transacciones/movimientos (se agrega un resumen aparte).
  // El detalle completo se obtiene con findById (GET /cash-registers/:id)
  private readonly summaryIncludeQuery = {
    opening: { include: { user: true } },
    closing: { include: { user: true } },
  };

  async open(openDto: OpenCashRegisterDto): Promise<CashRegisterRecordEntity> {
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
    const updated = await prisma.cashRegisterRecord.update({
      where: { id: closeDto.cashRegisterRecordId },
      data: {
        status: 'CLOSED',
        closing: {
          create: {
            cashProvided: closeDto.cashProvided,
            difference: closeDto.difference,
            totalTransactions: closeDto.totalTransactions,
            totalCashInOut: closeDto.totalCashInOut,
            totalExpected: closeDto.totalExpected,
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

    if (!record) throw CustomError.notFound(`Cash register record with id ${id} not found`);
    return CashRegisterRecordEntity.fromObject(record);
  }

  async getAll(paginationDto: PaginationDto): Promise<CashRegisterPaginatedResult> {
    const { page, limit } = paginationDto;

    const [total, records] = await Promise.all([
      prisma.cashRegisterRecord.count(),
      prisma.cashRegisterRecord.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: this.summaryIncludeQuery,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const summaries = await this.getSummaries(records.map((record) => record.id));

    return {
      total,
      records: records.map((record) =>
        CashRegisterRecordEntity.fromObject({ ...record, summary: summaries.get(record.id) })
      ),
    };
  }

  // Conteos y totales por caja calculados en la BD (sin traer cada transacción)
  private async getSummaries(ids: number[]): Promise<Map<number, CashRegisterSummary>> {
    const where = { cashRegisterRecordId: { in: ids } };

    const [transactionTotals, cashInOutTotals] = await Promise.all([
      prisma.transactionRecord.groupBy({
        by: ['cashRegisterRecordId'],
        where,
        _sum: { amountToCharge: true },
        _count: { _all: true },
      }),
      prisma.cashInOutRecord.groupBy({
        by: ['cashRegisterRecordId', 'type'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const summaries = new Map<number, CashRegisterSummary>(
      ids.map((id) => [
        id,
        { transactionsCount: 0, totalTransactions: 0, cashInOutCount: 0, totalCashIn: 0, totalCashOut: 0 },
      ])
    );

    for (const row of transactionTotals) {
      const summary = summaries.get(row.cashRegisterRecordId)!;
      summary.transactionsCount = row._count._all;
      summary.totalTransactions = Number(row._sum.amountToCharge ?? 0);
    }

    for (const row of cashInOutTotals) {
      const summary = summaries.get(row.cashRegisterRecordId)!;
      summary.cashInOutCount += row._count._all;
      if (row.type === 'IN') summary.totalCashIn = Number(row._sum.amount ?? 0);
      else summary.totalCashOut = Number(row._sum.amount ?? 0);
    }

    return summaries;
  }

  async createTransaction(dto: CreateTransactionDto): Promise<TransactionRecordEntity> {

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