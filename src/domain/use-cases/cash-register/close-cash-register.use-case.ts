import { CloseCashRegisterDto } from '../../dtos';
import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';
import { CustomError } from '../../errors/custom.error';
import { CashCalculatorHelper } from '../../helpers/cash-calculator.helper';

export interface CloseCashRegisterUseCase {
  execute(dto: CloseCashRegisterDto): Promise<CashRegisterRecordEntity>;
}

export class CloseCashRegister implements CloseCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRecordRepository) {}

  async execute(dto: CloseCashRegisterDto): Promise<CashRegisterRecordEntity> {
    // El repositorio bloquea la caja y ejecuta validate dentro de la misma transacción,
    // así ninguna venta nueva puede colarse entre el cálculo del balance y el cierre
    const closedRecord = await this.repository.close(dto, (record) => this.validate(record, dto));
    return closedRecord.sanitize();
  }

  private validate(record: CashRegisterRecordEntity, dto: CloseCashRegisterDto): void {
    // 1. Verificar que la caja esté ABIERTA
    if (record.status !== 'OPEN') {
      throw CustomError.badRequest('Cash register is already closed');
    }

    if (!record.opening) {
      throw CustomError.internalServer('Cash register opening data is missing');
    }

    // 2. Calcular montos reales del sistema usando el helper
    const openingCash = record.opening.cash;
    const balance = CashCalculatorHelper.calculateBalance(
      openingCash,
      record.transactions,
      record.cashInOut,
      dto.cashProvided
    );

    // 3. Validar auditablemente que los totales enviados coincidan con el sistema
    if (dto.totalTransactions !== balance.totalTransactions) {
      throw CustomError.badRequest(
        `totalTransactions mismatch. Expected ${balance.totalTransactions}, but received ${dto.totalTransactions}`
      );
    }

    if (dto.totalCashInOut !== balance.totalCashInOut) {
      throw CustomError.badRequest(
        `totalCashInOut mismatch. Expected ${balance.totalCashInOut}, but received ${dto.totalCashInOut}`
      );
    }

    if (dto.totalExpected !== balance.totalExpected) {
      throw CustomError.badRequest(
        `totalExpected mismatch. Expected ${balance.totalExpected}, but received ${dto.totalExpected}`
      );
    }

    if (dto.difference !== balance.difference) {
      throw CustomError.badRequest(
        `difference mismatch. Expected ${balance.difference}, but received ${dto.difference}`
      );
    }
  }
}
