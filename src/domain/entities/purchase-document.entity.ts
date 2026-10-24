import { CustomError } from '../errors/custom.error';
import {
  DteTotals,
  DteWarning,
  PurchaseDocumentItem,
  PurchaseDocumentReference,
  PurchaseDocumentType,
  PurchaseRelatedDocument,
  PurchaseSupplierSummary,
  PurchaseUserSummary,
  PurchaseVoidInfo,
} from '../interfaces/purchase.interface';

const ELECTRONIC_GENERATION = 2;

const toDateString = (value: unknown) => new Date(value as string).toISOString().slice(0, 10);

const toReference = (document: { [key: string]: any }): PurchaseDocumentReference => ({
  id: Number(document.id),
  generationCode: document.generationCode,
  controlNumber: document.controlNumber,
  issueDate: toDateString(document.issueDate),
  total: Number(document.total),
  voided: document.voidedAt !== null && document.voidedAt !== undefined,
});

const toUser = (user: { [key: string]: any } | null | undefined): PurchaseUserSummary | null =>
  user ? { id: Number(user.id), name: user.name } : null;

// En listados solo vienen encabezado y totales; items, relatedDocuments y creditNotes solo en el detalle
export class PurchaseDocumentEntity {
  constructor(
    public id: number,
    public type: PurchaseDocumentType,
    public generationCode: string,
    public controlNumber: string,
    public receptionStamp: string,
    public schemaVersion: number,
    public issueDate: string, // YYYY-MM-DD
    public issueTime: string,
    public currency: string,
    public receiverNrc: string,
    public operationCondition: number,
    public totals: DteTotals,
    public supplier: PurchaseSupplierSummary,
    public warnings: DteWarning[],
    public pendingLinks: string[], // Códigos de créditos fiscales aún no registrados
    public voided: PurchaseVoidInfo | null,
    public importedBy: PurchaseUserSummary | null,
    public createdAt: Date,
    public items?: PurchaseDocumentItem[],
    public relatedDocuments?: PurchaseRelatedDocument[],
    public creditNotes?: PurchaseDocumentReference[]
  ) {}

  get isVoided(): boolean {
    return this.voided !== null;
  }

  public static fromObject(object: { [key: string]: any }): PurchaseDocumentEntity {
    const {
      id,
      type,
      generationCode,
      controlNumber,
      receptionStamp,
      schemaVersion,
      issueDate,
      issueTime,
      currency,
      receiverNrc,
      operationCondition,
      supplier,
      warnings,
      voidedAt,
      voidReason,
      voidedBy,
      importedBy,
      createdAt,
      items,
      relatedDocuments,
      creditNotes,
    } = object;

    if (!id) throw CustomError.internalServer('Purchase document ID is required');
    if (!generationCode) throw CustomError.internalServer('Purchase document generationCode is required');
    if (!supplier) throw CustomError.internalServer('Purchase document supplier is required');

    const totals: DteTotals = {
      nonSubjectTotal: Number(object.nonSubjectTotal),
      exemptTotal: Number(object.exemptTotal),
      taxedTotal: Number(object.taxedTotal),
      discountTotal: Number(object.discountTotal),
      subtotal: Number(object.subtotal),
      ivaAmount: Number(object.ivaAmount),
      ivaPerceived: Number(object.ivaPerceived),
      ivaWithheld: Number(object.ivaWithheld),
      incomeTaxWithheld: Number(object.incomeTaxWithheld),
      operationTotal: Number(object.operationTotal),
      total: Number(object.total),
    };

    // Relaciones electrónicas sin documento vinculado = pendientes de vincular
    const relations: any[] = Array.isArray(relatedDocuments) ? relatedDocuments : [];
    const pendingLinks = relations
      .filter((relation) => relation.generationType === ELECTRONIC_GENERATION && relation.relatedDocumentId === null)
      .map((relation) => relation.relatedDocumentNumber);

    // El detalle (findById) es el único que carga las líneas y los documentos relacionados
    const isDetail = Array.isArray(items);

    return new PurchaseDocumentEntity(
      Number(id),
      type,
      generationCode,
      controlNumber,
      receptionStamp,
      Number(schemaVersion),
      toDateString(issueDate),
      issueTime,
      currency,
      receiverNrc,
      Number(operationCondition),
      totals,
      { id: Number(supplier.id), name: supplier.name, nit: supplier.nit },
      Array.isArray(warnings) ? warnings : [],
      pendingLinks,
      voidedAt ? { voidedAt: new Date(voidedAt), reason: voidReason ?? '', voidedBy: toUser(voidedBy) } : null,
      toUser(importedBy),
      new Date(createdAt),
      isDetail
        ? items
            .map((item: any) => ({
              itemNumber: Number(item.itemNumber),
              itemType: Number(item.itemType),
              code: item.code ?? null,
              description: item.description,
              quantity: Number(item.quantity),
              unitOfMeasure: Number(item.unitOfMeasure),
              unitPrice: Number(item.unitPrice),
              discount: Number(item.discount),
              nonSubjectSale: Number(item.nonSubjectSale),
              exemptSale: Number(item.exemptSale),
              taxedSale: Number(item.taxedSale),
              relatedDocumentCode: item.relatedDocumentCode ?? null,
            }))
            .sort((a, b) => a.itemNumber - b.itemNumber)
        : undefined,
      isDetail
        ? relations.map((relation) => ({
            relatedType: relation.relatedType,
            generationType: Number(relation.generationType),
            relatedDocumentNumber: relation.relatedDocumentNumber,
            relatedIssueDate: toDateString(relation.relatedIssueDate),
            document: relation.relatedDocument ? toReference(relation.relatedDocument) : null,
          }))
        : undefined,
      isDetail && Array.isArray(creditNotes) ? creditNotes.map((relation: any) => toReference(relation.creditNote)) : undefined
    );
  }
}
