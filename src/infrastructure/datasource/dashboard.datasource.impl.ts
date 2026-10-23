import { prisma } from '../../data/postgres';
import {
  DashboardDatasource,
  EmployeeSalesRaw,
  SalesReportDto,
  SalesSummaryRaw,
  SalesTimePoint,
} from '../../domain';
import { SalesCalculatorHelper } from '../../domain/helpers/sales-calculator.helper';

// Las fechas se guardan en UTC (timestamp sin zona). Para agrupar por día/semana/mes
// se convierten a la zona horaria del negocio: "date" AT TIME ZONE 'UTC' AT TIME ZONE tz.
// Las semanas inician en lunes (date_trunc('week') de Postgres).
export class DashboardDatasourceImpl implements DashboardDatasource {
  constructor(private readonly timezone: string) {}

  async getSalesSummary(): Promise<SalesSummaryRaw> {
    const tz = this.timezone;

    const [row] = await prisma.$queryRaw<
      { [key: string]: number }[]
    >`
      WITH bounds AS (
        SELECT
          date_trunc('day',   now() AT TIME ZONE ${tz}) AS day_start,
          date_trunc('week',  now() AT TIME ZONE ${tz}) AS week_start,
          date_trunc('month', now() AT TIME ZONE ${tz}) AS month_start,
          date_trunc('year',  now() AT TIME ZONE ${tz}) AS year_start
      ),
      sales AS (
        SELECT t."date" AT TIME ZONE 'UTC' AT TIME ZONE ${tz} AS local_date, t."amountToCharge" AS amount
        FROM "TransactionRecord" t, bounds b
        WHERE t."date" >= (LEAST(b.week_start, b.year_start) AT TIME ZONE ${tz}) AT TIME ZONE 'UTC'
      )
      SELECT
        COALESCE(ROUND(SUM(s.amount) FILTER (WHERE s.local_date >= b.day_start)::numeric, 2), 0)::float8   AS "todayTotal",
        COUNT(*) FILTER (WHERE s.local_date >= b.day_start)::int                                            AS "todayCount",
        COALESCE(ROUND(SUM(s.amount) FILTER (WHERE s.local_date >= b.week_start)::numeric, 2), 0)::float8  AS "weekTotal",
        COUNT(*) FILTER (WHERE s.local_date >= b.week_start)::int                                           AS "weekCount",
        COALESCE(ROUND(SUM(s.amount) FILTER (WHERE s.local_date >= b.month_start)::numeric, 2), 0)::float8 AS "monthTotal",
        COUNT(*) FILTER (WHERE s.local_date >= b.month_start)::int                                          AS "monthCount",
        COALESCE(ROUND(SUM(s.amount) FILTER (WHERE s.local_date >= b.year_start)::numeric, 2), 0)::float8  AS "yearTotal",
        COUNT(*) FILTER (WHERE s.local_date >= b.year_start)::int                                           AS "yearCount"
      FROM bounds b
      LEFT JOIN sales s ON true
      GROUP BY b.day_start, b.week_start, b.month_start, b.year_start
    `;

    const value = (key: string) => Number(row?.[key] ?? 0);

    return {
      today: { total: value('todayTotal'), count: value('todayCount') },
      week: { total: value('weekTotal'), count: value('weekCount') },
      month: { total: value('monthTotal'), count: value('monthCount') },
      year: { total: value('yearTotal'), count: value('yearCount') },
    };
  }

  // Incluye a los empleados activos aunque no tengan ventas en el rango
  async getSalesByEmployee(dto: SalesReportDto): Promise<EmployeeSalesRaw[]> {
    const tz = this.timezone;

    const rows = await prisma.$queryRaw<EmployeeSalesRaw[]>`
      SELECT
        e."id"        AS "employeeId",
        e."name"      AS "name",
        e."available" AS "available",
        COALESCE(ROUND(SUM(t."amountToCharge")::numeric, 2), 0)::float8 AS "total",
        COUNT(t."id")::int AS "count"
      FROM "Employee" e
      LEFT JOIN "TransactionRecord" t
        ON t."employeeId" = e."id"
       AND t."date" >= (${dto.from}::date::timestamp AT TIME ZONE ${tz}) AT TIME ZONE 'UTC'
       AND t."date" <  ((${dto.to}::date + 1)::timestamp AT TIME ZONE ${tz}) AT TIME ZONE 'UTC'
      GROUP BY e."id", e."name", e."available"
      HAVING e."available" = true OR COUNT(t."id") > 0
    `;

    return rows.map((row) => ({
      employeeId: Number(row.employeeId),
      name: row.name,
      available: row.available,
      total: Number(row.total),
      count: Number(row.count),
    }));
  }

  // Devuelve un punto por periodo, incluidos los periodos sin ventas (total 0),
  // con el desglose por empleado para las barras apiladas
  async getSalesOverTime(dto: SalesReportDto): Promise<SalesTimePoint[]> {
    const tz = this.timezone;
    const { groupBy, employeeIds } = dto;

    const rows = await prisma.$queryRaw<
      { period: string; employeeId: number | null; total: number; count: number }[]
    >`
      WITH periods AS (
        SELECT generate_series(
          date_trunc(${groupBy}, ${dto.from}::date::timestamp),
          date_trunc(${groupBy}, ${dto.to}::date::timestamp),
          ('1 ' || ${groupBy})::interval
        ) AS period_start
      ),
      sales AS (
        SELECT
          date_trunc(${groupBy}, t."date" AT TIME ZONE 'UTC' AT TIME ZONE ${tz}) AS period_start,
          t."employeeId" AS employee_id,
          t."amountToCharge" AS amount
        FROM "TransactionRecord" t
        WHERE t."date" >= (${dto.from}::date::timestamp AT TIME ZONE ${tz}) AT TIME ZONE 'UTC'
          AND t."date" <  ((${dto.to}::date + 1)::timestamp AT TIME ZONE ${tz}) AT TIME ZONE 'UTC'
          AND (${employeeIds}::int[] IS NULL OR t."employeeId" = ANY(${employeeIds}::int[]))
      )
      SELECT
        to_char(p.period_start, 'YYYY-MM-DD') AS "period",
        s.employee_id AS "employeeId",
        COALESCE(ROUND(SUM(s.amount)::numeric, 2), 0)::float8 AS "total",
        COUNT(s.amount)::int AS "count"
      FROM periods p
      LEFT JOIN sales s ON s.period_start = p.period_start
      GROUP BY p.period_start, s.employee_id
      ORDER BY p.period_start, s.employee_id
    `;

    // Una fila por (periodo, empleado); los periodos sin ventas llegan con employeeId null
    const points = new Map<string, SalesTimePoint>();
    for (const row of rows) {
      const point = points.get(row.period) ?? { period: row.period, total: 0, count: 0, byEmployee: [] };
      points.set(row.period, point);
      if (row.employeeId === null) continue;

      const total = Number(row.total);
      const count = Number(row.count);
      point.byEmployee.push({ employeeId: Number(row.employeeId), total, count });
      point.total = SalesCalculatorHelper.round(point.total + total);
      point.count += count;
    }

    return [...points.values()];
  }
}
