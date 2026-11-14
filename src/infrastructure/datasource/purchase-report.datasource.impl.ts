import { Prisma } from '@prisma/client';
import { prisma } from '../../data/postgres';
import {
  PurchaseDocumentType,
  PurchaseReportDatasource,
  PurchaseReportDto,
  PurchaseTotalsRow,
  PurchaseYearReportDto,
  SupplierPurchaseTotalsRow,
} from '../../domain';

type RawTotalsRow = { [key in keyof PurchaseTotalsRow]: string | number };

interface ReportFilters {
  from: string;
  to: string;
  receiverNrc: string | null;
  supplierId: number | null;
}

// issueDate es DATE (sin hora): los rangos y los meses no dependen de la zona horaria.
// Solo cuentan los documentos activos; las notas de crédito se suman aparte y el dominio las resta.
export class PurchaseReportDatasourceImpl implements PurchaseReportDatasource {
  async getTotalsByMonth(dto: PurchaseYearReportDto): Promise<PurchaseTotalsRow[]> {
    const { year, receiverNrc, supplierId } = dto;
    return this.aggregate(Prisma.sql`to_char(d."issueDate", 'YYYY-MM')`, { from: `${year}-01-01`, to: `${year}-12-31`, receiverNrc, supplierId });
  }

  async getTotals(dto: PurchaseReportDto): Promise<PurchaseTotalsRow[]> {
    return this.aggregate(Prisma.sql`'all'`, dto);
  }

  async getTotalsBySupplier(dto: PurchaseReportDto): Promise<SupplierPurchaseTotalsRow[]> {
    const rows = await this.aggregate(Prisma.sql`d."supplierId"::text`, dto);

    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: [...new Set(rows.map((row) => Number(row.key)))] } },
      select: { id: true, name: true, nit: true },
    });
    const byId = new Map(suppliers.map((supplier) => [String(supplier.id), supplier]));

    return rows.map((row) => ({ ...row, name: byId.get(row.key)?.name ?? '', nit: byId.get(row.key)?.nit ?? '' }));
  }

  private async aggregate(key: Prisma.Sql, filters: ReportFilters): Promise<PurchaseTotalsRow[]> {
    const { from, to, receiverNrc, supplierId } = filters;
    const rows = await prisma.$queryRaw<RawTotalsRow[]>`
      SELECT
        ${key} AS "key",
        d."type"::text AS "type",
        COUNT(*)::int AS "documents",
        COALESCE(SUM(d."taxedTotal"), 0)::float8 AS "taxed",
        COALESCE(SUM(d."exemptTotal"), 0)::float8 AS "exempt",
        COALESCE(SUM(d."nonSubjectTotal"), 0)::float8 AS "nonSubject",
        COALESCE(SUM(d."ivaAmount"), 0)::float8 AS "iva",
        COALESCE(SUM(d."ivaPerceived"), 0)::float8 AS "ivaPerceived",
        COALESCE(SUM(d."ivaWithheld"), 0)::float8 AS "ivaWithheld",
        COALESCE(SUM(d."total"), 0)::float8 AS "total"
      FROM "PurchaseDocument" d
      WHERE d."voidedAt" IS NULL
        AND d."issueDate" BETWEEN ${from}::date AND ${to}::date
        AND (${receiverNrc}::text IS NULL OR d."receiverNrc" = ${receiverNrc}::text)
        AND (${supplierId}::int IS NULL OR d."supplierId" = ${supplierId}::int)
      GROUP BY 1, 2
      ORDER BY 1, 2
    `;

    return rows.map((row) => ({
      key: String(row.key),
      type: row.type as PurchaseDocumentType,
      documents: Number(row.documents),
      taxed: Number(row.taxed),
      exempt: Number(row.exempt),
      nonSubject: Number(row.nonSubject),
      iva: Number(row.iva),
      ivaPerceived: Number(row.ivaPerceived),
      ivaWithheld: Number(row.ivaWithheld),
      total: Number(row.total),
    }));
  }
}
