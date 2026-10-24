import { Prisma } from '@prisma/client';
import { prisma } from '../../data/postgres';
import { CreatePurchaseDocumentResult, ParsedDte, PurchaseDocumentDatasource } from '../../domain';

const ELECTRONIC_GENERATION = 2;

// Las fechas YYYY-MM-DD se guardan en columnas DATE (sin hora ni zona horaria)
const toDate = (value: string) => new Date(`${value}T00:00:00Z`);

export class PurchaseDocumentDatasourceImpl implements PurchaseDocumentDatasource {
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
