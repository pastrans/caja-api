import { DateHelper } from '../../helpers/date.helper';
import { SalesGroupBy } from '../../interfaces/dashboard.interface';

const GROUP_BY_VALUES: SalesGroupBy[] = ['day', 'week', 'month'];
const MAX_DAYS_BY_DAY = 366;

export class SalesReportDto {
  private constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly groupBy: SalesGroupBy,
    public readonly employeeIds: number[] | null,
  ) {}

  // Si no se envían fechas, el rango por defecto es el mes en curso (del día 1 a hoy)
  static create(props: { [key: string]: any }, timezone: string): [string, undefined] | [undefined, SalesReportDto] {
    const { from, to, groupBy = 'day', employeeId, employeeIds } = props;

    const today = DateHelper.today(timezone);
    const toDate = to ?? today;
    const fromDate = from ?? DateHelper.startOfMonth(toDate);

    if (!DateHelper.isValidDate(fromDate)) return ['from must be a valid date (YYYY-MM-DD)', undefined];
    if (!DateHelper.isValidDate(toDate)) return ['to must be a valid date (YYYY-MM-DD)', undefined];
    if (fromDate > toDate) return ['from must be before or equal to to', undefined];

    if (!GROUP_BY_VALUES.includes(groupBy)) {
      return [`groupBy must be one of: ${GROUP_BY_VALUES.join(', ')}`, undefined];
    }

    if (groupBy === 'day' && DateHelper.daysBetween(fromDate, toDate) >= MAX_DAYS_BY_DAY) {
      return [`Date range cannot exceed ${MAX_DAYS_BY_DAY} days when grouping by day`, undefined];
    }

    // employeeIds acepta "1,2,3" o el parámetro repetido; employeeId (uno solo) se mantiene por compatibilidad
    const rawIds: unknown[] = [employeeIds, employeeId]
      .filter((value) => value !== undefined && value !== '')
      .flatMap((value) => (Array.isArray(value) ? value : String(value).split(',')));

    const ids = [...new Set(rawIds.map((value) => Number(String(value).trim())))];
    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
      return ['employeeIds must be a comma-separated list of positive integers', undefined];
    }

    return [undefined, new SalesReportDto(fromDate, toDate, groupBy, ids.length > 0 ? ids : null)];
  }
}
