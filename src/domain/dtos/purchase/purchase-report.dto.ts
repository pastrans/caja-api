import { DateHelper } from '../../helpers/date.helper';

const MIN_YEAR = 2000;

const validateNrc = (receiverNrc: unknown): string | undefined =>
  receiverNrc !== undefined && (typeof receiverNrc !== 'string' || !/^\d+$/.test(receiverNrc))
    ? 'receiverNrc must contain only digits'
    : undefined;

// supplierId opcional: limita el reporte a un proveedor (sin compras, los totales salen en cero)
const parseSupplierId = (supplierId: unknown): [string, undefined] | [undefined, number | null] => {
  if (supplierId === undefined) return [undefined, null];
  const value = Number(supplierId);
  if (!Number.isInteger(value) || value <= 0) return ['supplierId must be a positive integer', undefined];
  return [undefined, value];
};

// Rango de fechas de los reportes de compras (por defecto, el mes en curso)
export class PurchaseReportDto {
  private constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly receiverNrc: string | null,
    public readonly supplierId: number | null,
  ) {}

  static create(props: { [key: string]: any }, timezone: string): [string, undefined] | [undefined, PurchaseReportDto] {
    const { from, to, receiverNrc, supplierId } = props;

    const toDate = to ?? DateHelper.today(timezone);
    const fromDate = from ?? DateHelper.startOfMonth(toDate);

    if (!DateHelper.isValidDate(fromDate)) return ['from must be a valid date (YYYY-MM-DD)', undefined];
    if (!DateHelper.isValidDate(toDate)) return ['to must be a valid date (YYYY-MM-DD)', undefined];
    if (fromDate > toDate) return ['from must be before or equal to to', undefined];

    const nrcError = validateNrc(receiverNrc);
    if (nrcError) return [nrcError, undefined];

    const [supplierError, supplier] = parseSupplierId(supplierId);
    if (supplierError) return [supplierError, undefined];

    return [undefined, new PurchaseReportDto(fromDate, toDate, receiverNrc ?? null, supplier!)];
  }
}

// Año del resumen mensual de IVA (por defecto, el año en curso)
export class PurchaseYearReportDto {
  private constructor(
    public readonly year: number,
    public readonly receiverNrc: string | null,
    public readonly supplierId: number | null,
  ) {}

  static create(props: { [key: string]: any }, timezone: string): [string, undefined] | [undefined, PurchaseYearReportDto] {
    const { year, receiverNrc, supplierId } = props;

    const currentYear = Number(DateHelper.today(timezone).slice(0, 4));
    const value = year !== undefined ? Number(year) : currentYear;
    if (!Number.isInteger(value) || value < MIN_YEAR || value > currentYear + 1) {
      return [`year must be an integer between ${MIN_YEAR} and ${currentYear + 1}`, undefined];
    }

    const nrcError = validateNrc(receiverNrc);
    if (nrcError) return [nrcError, undefined];

    const [supplierError, supplier] = parseSupplierId(supplierId);
    if (supplierError) return [supplierError, undefined];

    return [undefined, new PurchaseYearReportDto(value, receiverNrc ?? null, supplier!)];
  }
}
