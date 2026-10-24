export type PurchaseDocumentType = 'CREDITO_FISCAL' | 'NOTA_CREDITO';

// Archivo recibido en la importación (el contenido se decodifica en el dominio: UTF-8 o Latin-1)
export interface DteFile {
  name: string;
  content: Uint8Array;
}

export type DteRejectionCode =
  | 'INVALID_FILE'
  | 'INVALID_JSON'
  | 'INVALID_STRUCTURE'
  | 'UNSUPPORTED_TYPE'
  | 'TEST_ENVIRONMENT'
  | 'MISSING_STAMP'
  | 'RECEIVER_MISMATCH'
  | 'DUPLICATE'
  | 'INTERNAL_ERROR';

export type DteWarningCode = 'MH_OBSERVATIONS' | 'TOTALS_MISMATCH' | 'PENDING_LINK';

export interface DteRejection {
  reason: DteRejectionCode;
  message: string;
}

export interface DteWarning {
  code: DteWarningCode;
  message: string;
}

export interface DteSupplierData {
  nit: string;
  nrc: string | null;
  name: string;
  commercialName: string | null;
  activityCode: string | null;
  activityDescription: string | null;
  phone: string | null;
  email: string | null;
}

export interface DteTotals {
  nonSubjectTotal: number;
  exemptTotal: number;
  taxedTotal: number;
  discountTotal: number;
  subtotal: number;
  ivaAmount: number;
  ivaPerceived: number;
  ivaWithheld: number;
  incomeTaxWithheld: number;
  operationTotal: number;
  total: number;
}

export interface DteItemData {
  itemNumber: number;
  itemType: number;
  code: string | null;
  description: string;
  quantity: number;
  unitOfMeasure: number;
  unitPrice: number;
  discount: number;
  nonSubjectSale: number;
  exemptSale: number;
  taxedSale: number;
  relatedDocumentCode: string | null;
}

export interface DteRelationData {
  relatedType: string;
  generationType: number; // 1 físico, 2 electrónico
  relatedDocumentNumber: string;
  relatedIssueDate: string; // YYYY-MM-DD
}

// DTE validado y normalizado, listo para guardarse
export interface ParsedDte {
  type: PurchaseDocumentType;
  generationCode: string;
  controlNumber: string;
  receptionStamp: string;
  schemaVersion: number;
  issueDate: string; // YYYY-MM-DD
  issueTime: string;
  currency: string;
  receiverNrc: string;
  operationCondition: number;
  totals: DteTotals;
  supplier: DteSupplierData;
  items: DteItemData[];
  relations: DteRelationData[];
  warnings: DteWarning[];
  rawJson: object;
}

export type CreatePurchaseDocumentResult =
  | { status: 'created'; id: number; pendingLinks: string[]; linkedCreditNotes: number }
  | { status: 'duplicate' };

export type ImportFileResult =
  | {
      file: string;
      status: 'imported';
      documentId: number;
      type: PurchaseDocumentType;
      generationCode: string;
      linkedCreditNotes: number;
      warnings: DteWarning[];
    }
  | { file: string; status: 'rejected'; reason: DteRejectionCode; message: string };

export interface ImportPurchaseDocumentsResult {
  summary: { received: number; imported: number; rejected: number; withWarnings: number };
  results: ImportFileResult[];
}

// ----------------------------------------------------
// Consulta de documentos
// ----------------------------------------------------

export type PurchaseDocumentStatus = 'active' | 'voided' | 'all';

export interface PurchaseSupplierSummary {
  id: number;
  name: string;
  nit: string;
}

export interface PurchaseUserSummary {
  id: number;
  name: string;
}

export interface PurchaseVoidInfo {
  voidedAt: Date;
  reason: string;
  voidedBy: PurchaseUserSummary | null;
}

// Referencia corta a otro documento (crédito fiscal de una nota, o nota de un crédito fiscal)
export interface PurchaseDocumentReference {
  id: number;
  generationCode: string;
  controlNumber: string;
  issueDate: string;
  total: number;
  voided: boolean;
}

export interface PurchaseRelatedDocument extends DteRelationData {
  document: PurchaseDocumentReference | null; // null: pendiente de vincular o documento físico
}

export type PurchaseDocumentItem = DteItemData;

export interface PurchaseVoidWarning {
  code: 'HAS_CREDIT_NOTES';
  message: string;
}

// ----------------------------------------------------
// Reportes
// ----------------------------------------------------

export interface PurchaseAmounts {
  taxed: number;
  exempt: number;
  nonSubject: number;
  iva: number;
  ivaPerceived: number;
  ivaWithheld: number;
  total: number;
}

export interface PurchaseTotals extends PurchaseAmounts {
  documents: number;
}

// Créditos fiscales menos notas de crédito
export interface PurchaseNetTotals extends PurchaseAmounts {
  ivaCredit: number; // IVA 13 % + IVA percibido 1 %
}

export interface PurchaseTotalsBreakdown {
  creditosFiscales: PurchaseTotals;
  notasCredito: PurchaseTotals;
  net: PurchaseNetTotals;
}

// Fila agregada de la base de datos: una por grupo (mes, proveedor...) y tipo de documento
export interface PurchaseTotalsRow extends PurchaseTotals {
  key: string;
  type: PurchaseDocumentType;
}

export interface PurchaseMonthSummary extends PurchaseTotalsBreakdown {
  month: string; // YYYY-MM
}

export interface PurchaseIvaSummary {
  year: number;
  receiverNrc: string | null;
  months: PurchaseMonthSummary[];
  total: PurchaseTotalsBreakdown;
}

export interface PurchaseSummary extends PurchaseTotalsBreakdown {
  from: string;
  to: string;
  receiverNrc: string | null;
}

export interface SupplierPurchases extends PurchaseNetTotals {
  supplierId: number;
  name: string;
  nit: string;
  creditosFiscales: number; // Número de documentos
  notasCredito: number;
  percentage: number; // % del total neto del rango
}

export interface PurchasesBySupplier {
  from: string;
  to: string;
  receiverNrc: string | null;
  total: number;
  suppliers: SupplierPurchases[];
}
