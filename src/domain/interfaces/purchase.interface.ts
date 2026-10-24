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
