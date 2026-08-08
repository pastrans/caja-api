import { PaginationDto } from '../../dtos';
import { CashRegisterRecordEntity } from '../../entities';
import { CashRegisterRecordRepository } from '../../repositories';
import { PaginatedResponse } from '../../interfaces/paginated-response.interface';
import { PaginationHelper } from '../../helpers/pagination.helper';

export interface GetCashRegistersUseCase {
  execute(paginationDto: PaginationDto): Promise<PaginatedResponse<CashRegisterRecordEntity>>;
}

export class GetCashRegisters implements GetCashRegistersUseCase {
  constructor(
    private readonly repository: CashRegisterRecordRepository,
    private readonly path: string = '/api/cash-registers'
  ) {}

  async execute(paginationDto: PaginationDto): Promise<PaginatedResponse<CashRegisterRecordEntity>> {
    const { records, total } = await this.repository.getAll(paginationDto);

    return PaginationHelper.createResponse<CashRegisterRecordEntity>(
      records,
      total,
      paginationDto,
      this.path
    );
  }
}