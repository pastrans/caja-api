import { Prisma } from '@prisma/client';
import { prisma } from '../../data/postgres';
import {
  CreatePurchaseDocumentResult,
  PaginationDto,
  ParsedDte,
  PurchaseDocumentDatasource,
  PurchaseDocumentEntity,
  PurchaseDocumentFiltersDto,
  PurchaseDocumentPaginatedResult,
  PurchaseDocumentStateChange,
  VoidPurchaseDocumentDto,
} from '../../domain';

const ELECTRONIC_GENERATION = 2;

// Las fechas YYYY-MM-DD se guardan en columnas DATE (sin hora ni zona horaria)
const toDate = (value: string) => new Date(`${value}T00:00:00Z`);

const userSummary = { select: { id: true, name: true } };
const documentReference = {
  select: { id: true, generationCode: true, controlNumber: true, issueDate: true, total: true, voidedAt: true },
};

// Listado: encabezado y totales. Las relaciones solo para saber si hay vínculos pendientes
const listInclude = {
  supplier: { select: { id: true, name: true, nit: true } },
  importedBy: userSummary,
  voidedBy: userSummary,
  relatedDocuments: { select: { generationType: true, relatedDocumentId: true, relatedDocumentNumber: true } },
} satisfies Prisma.PurchaseDocumentInclude;

const detailInclude = {
  ...listInclude,
  items: { orderBy: { itemNumber: 'asc' } },
  relatedDocuments: { include: { relatedDocument: documentReference }, orderBy: { id: 'asc' } },
  creditNotes: { include: { creditNote: documentReference }, orderBy: { id: 'asc' } },
} satisfies Prisma.PurchaseDocumentInclude;

export class PurchaseDocumentDatasourceImpl implements PurchaseDocumentDatasource {
  async getAll(paginationDto: PaginationDto, filters: PurchaseDocumentFiltersDto): Promise<PurchaseDocumentPaginatedResult> {
    const { page, limit } = paginationDto;
    const where = this.buildWhere(filters);

    const [total, documents] = await Promise.all([
      prisma.purchaseDocument.count({ where }),
      prisma.purchaseDocument.findMany({
        where,
        include: listInclude,
        omit: { rawJson: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ issueDate: 'desc' }, { id: 'desc' }],
      }),
    ]);

    return {
      total,
      documents: documents.map(PurchaseDocumentEntity.fromObject),
    };
  }

  // El JSON original no se devuelve: es grande (incluye la firma) y ya está desglosado
  async findById(id: number): Promise<PurchaseDocumentEntity | null> {
    const document = await prisma.purchaseDocument.findUnique({
      where: { id },
      include: detailInclude,
      omit: { rawJson: true },
    });
    if (!document) return null;
    return PurchaseDocumentEntity.fromObject(document);
  }

  // Atómico: solo anula si sigue activo (dos anulaciones simultáneas no se pisan)
  async voidById(dto: VoidPurchaseDocumentDto): Promise<PurchaseDocumentStateChange> {
    const { count } = await prisma.purchaseDocument.updateMany({
      where: { id: dto.id, voidedAt: null },
      data: { voidedAt: new Date(), voidReason: dto.reason, voidedById: dto.userId },
    });
    return count > 0 ? 'updated' : this.missingOrInvalid(dto.id);
  }

  async unvoidById(id: number): Promise<PurchaseDocumentStateChange> {
    const { count } = await prisma.purchaseDocument.updateMany({
      where: { id, voidedAt: { not: null } },
      data: { voidedAt: null, voidReason: null, voidedById: null },
    });
    return count > 0 ? 'updated' : this.missingOrInvalid(id);
  }

  private async missingOrInvalid(id: number): Promise<PurchaseDocumentStateChange> {
    const exists = await prisma.purchaseDocument.findUnique({ where: { id }, select: { id: true } });
    return exists ? 'invalid_state' : 'not_found';
  }

  private buildWhere(filters: PurchaseDocumentFiltersDto): Prisma.PurchaseDocumentWhereInput {
    const { type, supplierId, from, to, receiverNrc, status, withWarnings, pendingLink } = filters;

    return {
      ...(type && { type }),
      ...(supplierId && { supplierId }),
      ...((from || to) && {
        issueDate: { ...(from && { gte: toDate(from) }), ...(to && { lte: toDate(to) }) },
      }),
      ...(receiverNrc && { receiverNrc }),
      ...(status === 'active' && { voidedAt: null }),
      ...(status === 'voided' && { voidedAt: { not: null } }),
      ...(withWarnings && { warnings: { not: Prisma.DbNull } }),
      ...(pendingLink && {
        relatedDocuments: { some: { generationType: ELECTRONIC_GENERATION, relatedDocumentId: null } },
      }),
    };
  }

  async findExistingGenerationCodes(generationCodes: string[]): Promise<string[]> {
    if (generationCodes.length === 0) return [];

    const documents = await prisma.purchaseDocument.findMany({
      where: { generationCode: { in: generationCodes } },
      select: { generationCode: true },
    });
    return documents.map((document) => document.generationCode);
  }

  async create(dte: ParsedDte, importedById: number): Promise<CreatePurchaseDocumentResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        const supplierId = await this.upsertSupplier(tx, dte);

        const document = await tx.purchaseDocument.create({
          data: {
            type: dte.type,
            generationCode: dte.generationCode,
            controlNumber: dte.controlNumber,
            receptionStamp: dte.receptionStamp,
            schemaVersion: dte.schemaVersion,
            issueDate: toDate(dte.issueDate),
            issueTime: dte.issueTime,
            currency: dte.currency,
            receiverNrc: dte.receiverNrc,
            operationCondition: dte.operationCondition,
            ...dte.totals,
            // Solo se guardan las advertencias del propio documento; "pendiente de vincular" sale de las relaciones
            ...(dte.warnings.length > 0 && { warnings: dte.warnings as unknown as Prisma.InputJsonValue }),
            rawJson: dte.rawJson as Prisma.InputJsonValue,
            supplierId,
            importedById,
            items: { create: dte.items },
          },
          select: { id: true },
        });

        // Crédito fiscal: vincula las notas de crédito que lo esperaban
        let linkedCreditNotes = 0;
        if (dte.type === 'CREDITO_FISCAL') {
          const linked = await tx.creditNoteRelation.updateMany({
            where: { relatedDocumentNumber: dte.generationCode, generationType: ELECTRONIC_GENERATION, relatedDocumentId: null },
            data: { relatedDocumentId: document.id },
          });
          linkedCreditNotes = linked.count;
        }

        // Nota de crédito: vincula sus documentos relacionados (los que no existen quedan pendientes)
        const pendingLinks: string[] = [];
        for (const relation of dte.relations) {
          const related = relation.generationType === ELECTRONIC_GENERATION
            ? await tx.purchaseDocument.findUnique({ where: { generationCode: relation.relatedDocumentNumber }, select: { id: true } })
            : null;

          if (relation.generationType === ELECTRONIC_GENERATION && !related) {
            pendingLinks.push(relation.relatedDocumentNumber);
          }

          await tx.creditNoteRelation.create({
            data: {
              relatedType: relation.relatedType,
              generationType: relation.generationType,
              relatedDocumentNumber: relation.relatedDocumentNumber,
              relatedIssueDate: toDate(relation.relatedIssueDate),
              creditNoteId: document.id,
              relatedDocumentId: related?.id ?? null,
            },
          });
        }

        return { status: 'created' as const, id: document.id, pendingLinks, linkedCreditNotes };
      });
    } catch (error) {
      // Otra carga simultánea registró el mismo código de generación
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        JSON.stringify(error.meta ?? {}).includes('generationCode')
      ) {
        return { status: 'duplicate' };
      }
      throw error;
    }
  }

  // El proveedor se identifica por NIT; sus datos se actualizan con los del DTE más reciente
  private async upsertSupplier(tx: Prisma.TransactionClient, dte: ParsedDte): Promise<number> {
    const issueDate = toDate(dte.issueDate);

    const supplier = await tx.supplier.upsert({
      where: { nit: dte.supplier.nit },
      create: { ...dte.supplier, lastIssueDate: issueDate },
      update: {},
    });

    if (issueDate > supplier.lastIssueDate) {
      await tx.supplier.update({
        where: { id: supplier.id },
        data: { ...dte.supplier, lastIssueDate: issueDate },
      });
    }

    return supplier.id;
  }
}
