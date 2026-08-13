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
    // 1. Obtener la caja registrada
    const record = await this.repository.findById(dto.cashRegisterRecordId);
    if (!record) {
      throw CustomError.notFound(`Cash register record with ID ${dto.cashRegisterRecordId} not found`);
    }

    // 2. Verificar que la caja esté ABIERTA
    if (record.status !== 'OPEN') {
      throw CustomError.badRequest('Cash register is already closed');
    }

    if (!record.opening) {
      throw CustomError.internalServer('Cash register opening data is missing');
    }

    // 3. Calcular montos reales del sistema usando el helper
    const openingCash = record.opening.cash;
    const balance = CashCalculatorHelper.calculateBalance(
      openingCash,
      record.transactions,
      record.cashInOut,
      dto.cashProvided
    );

    // 4. Validar auditablemente que los totales enviados coincidan con el sistema
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

    // 5. Persistir el cierre y sanitizar respuesta
    const closedRecord = await this.repository.close(dto);
    return closedRecord.sanitize();
  }
}