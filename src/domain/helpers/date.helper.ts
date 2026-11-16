export class DateHelper {
  private static readonly DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

  // Fecha actual (YYYY-MM-DD) en la zona horaria indicada
  static today(timezone: string): string {
    // 'en-CA' formatea como YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
  }

  // Primer día del mes de una fecha YYYY-MM-DD
  static startOfMonth(date: string): string {
    return `${date.slice(0, 7)}-01`;
  }

  // Valida formato YYYY-MM-DD y que la fecha exista (ej: rechaza 2026-02-30)
  static isValidDate(value: unknown): value is string {
    if (typeof value !== 'string' || !this.DATE_REGEX.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  // Diferencia en días entre dos fechas YYYY-MM-DD
  static daysBetween(from: string, to: string): number {
    const ms = new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
    return Math.round(ms / 86_400_000);
  }

  // Suma (o resta) días a una fecha YYYY-MM-DD
  static addDays(date: string, days: number): string {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }

  // Resta meses a una fecha YYYY-MM-DD; si el día no existe en el mes destino, usa el último (31-mar - 1 = 28/29-feb)
  static subtractMonths(date: string, months: number): string {
    const [year, month, day] = date.split('-').map(Number) as [number, number, number];
    const target = new Date(Date.UTC(year, month - 1 - months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(day, lastDay));
    return target.toISOString().slice(0, 10);
  }
}
