import { DateHelper } from '../../helpers/date.helper';
import { ProductKeyHelper } from '../../helpers/product-price.helper';
import { PurchaseProductSort } from '../../interfaces/purchase-product.interface';

const MAX_MONTHS = 120;
const DEFAULT_MONTHS = 12;
const ALL_TIME_FROM = '2000-01-01';
const SORTS: PurchaseProductSort[] = ['spent', 'change', 'trend', 'name', 'recent'];

// Periodo del análisis: los últimos N meses hasta hoy (zona del negocio). months=all usa todo el historial
const parsePeriod = (months: unknown, timezone: string): [string, undefined] | [undefined, { months: number | null; from: string; to: string }] => {
  const to = DateHelper.today(timezone);
  if (months === 'all') return [undefined, { months: null, from: ALL_TIME_FROM, to }];

  const value = months === undefined ? DEFAULT_MONTHS : Number(months);
  if (!Number.isInteger(value) || value < 1 || value > MAX_MONTHS) {
    return [`months must be an integer between 1 and ${MAX_MONTHS}, or "all"`, undefined];
  }
  return [undefined, { months: value, from: DateHelper.subtractMonths(to, value), to }];
};

export class PurchaseProductsDto {
  private constructor(
    public readonly months: number | null,
    public readonly from: string,
    public readonly to: string,
    public readonly supplierId: number | null,
    public readonly search: string | null,
    public readonly sort: PurchaseProductSort,
    public readonly order: 'asc' | 'desc',
  ) {}

  static create(props: { [key: string]: any }, timezone: string): [string, undefined] | [undefined, PurchaseProductsDto] {
    const { months, supplierId, search, sort, order } = props;

    const [periodError, period] = parsePeriod(months, timezone);
    if (periodError) return [periodError, undefined];

    let supplier: number | null = null;
    if (supplierId !== undefined) {
      supplier = Number(supplierId);
      if (!Number.isInteger(supplier) || supplier <= 0) return ['supplierId must be a positive integer', undefined];
    }

    if (search !== undefined && typeof search !== 'string') return ['search must be a string', undefined];

    const sortValue = (sort ?? 'spent') as PurchaseProductSort;
    if (!SORTS.includes(sortValue)) return [`sort must be one of: ${SORTS.join(', ')}`, undefined];

    // Por defecto: alfabético para el nombre, de mayor a menor para lo demás
    const orderValue = order ?? (sortValue === 'name' ? 'asc' : 'desc');
    if (orderValue !== 'asc' && orderValue !== 'desc') return ['order must be asc or desc', undefined];

    return [undefined, new PurchaseProductsDto(period!.months, period!.from, period!.to, supplier, search?.trim() || null, sortValue, orderValue)];
  }
}

export class PurchaseProductHistoryDto {
  private constructor(
    public readonly key: string,
    public readonly supplierId: number,
    public readonly unitOfMeasure: number,
    public readonly ref: string,
    public readonly months: number | null,
    public readonly from: string,
    public readonly to: string,
  ) {}

  static create(props: { [key: string]: any }, timezone: string): [string, undefined] | [undefined, PurchaseProductHistoryDto] {
    const { key, months } = props;

    const parsed = ProductKeyHelper.parse(key);
    if (!parsed) return ['key must have the form supplierId:unitOfMeasure:ref', undefined];

    const [periodError, period] = parsePeriod(months, timezone);
    if (periodError) return [periodError, undefined];

    return [undefined, new PurchaseProductHistoryDto(key, parsed.supplierId, parsed.unitOfMeasure, parsed.ref, period!.months, period!.from, period!.to)];
  }
}
