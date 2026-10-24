import { DateHelper } from '../../helpers/date.helper';
import { PurchaseDocumentStatus, PurchaseDocumentType } from '../../interfaces/purchase.interface';

const TYPES: PurchaseDocumentType[] = ['CREDITO_FISCAL', 'NOTA_CREDITO'];
const STATUSES: PurchaseDocumentStatus[] = ['active', 'voided', 'all'];

// Filtros del listado de documentos de compra (la paginación va en PaginationDto)
export class PurchaseDocumentFiltersDto {
  private constructor(
    public readonly type: PurchaseDocumentType | null,
    public readonly supplierId: number | null,
    public readonly from: string | null,
    public readonly to: string | null,
    public readonly receiverNrc: string | null,
    public readonly status: PurchaseDocumentStatus,
    public readonly withWarnings: boolean,
    public readonly pendingLink: boolean,
  ) {}

  static create(props: { [key: string]: any }): [string, undefined] | [undefined, PurchaseDocumentFiltersDto] {
    const { type, supplierId, from, to, receiverNrc, status = 'all', withWarnings, pendingLink } = props;

    if (type !== undefined && !TYPES.includes(type)) {
      return [`type must be one of: ${TYPES.join(', ')}`, undefined];
    }

    const supplier = supplierId !== undefined ? Number(supplierId) : null;
    if (supplier !== null && (!Number.isInteger(supplier) || supplier <= 0)) {
      return ['supplierId must be a positive integer', undefined];
    }

    if (from !== undefined && !DateHelper.isValidDate(from)) return ['from must be a valid date (YYYY-MM-DD)', undefined];
    if (to !== undefined && !DateHelper.isValidDate(to)) return ['to must be a valid date (YYYY-MM-DD)', undefined];
    if (from !== undefined && to !== undefined && from > to) return ['from must be before or equal to to', undefined];

    if (receiverNrc !== undefined && (typeof receiverNrc !== 'string' || !/^\d+$/.test(receiverNrc))) {
      return ['receiverNrc must contain only digits', undefined];
    }

    if (!STATUSES.includes(status)) {
      return [`status must be one of: ${STATUSES.join(', ')}`, undefined];
    }

    const [warningsError, warnings] = this.parseFlag(withWarnings, 'withWarnings');
    if (warningsError) return [warningsError, undefined];

    const [pendingError, pending] = this.parseFlag(pendingLink, 'pendingLink');
    if (pendingError) return [pendingError, undefined];

    return [
      undefined,
      new PurchaseDocumentFiltersDto(type ?? null, supplier, from ?? null, to ?? null, receiverNrc ?? null, status, warnings!, pending!),
    ];
  }

  private static parseFlag(value: unknown, name: string): [string, undefined] | [undefined, boolean] {
    if (value === undefined || value === 'false' || value === false) return [undefined, false];
    if (value === 'true' || value === true) return [undefined, true];
    return [`${name} must be a boolean value (true or false)`, undefined];
  }
}
