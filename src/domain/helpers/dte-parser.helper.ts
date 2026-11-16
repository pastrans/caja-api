import { DateHelper } from './date.helper';
import { ProductRefHelper } from './product-ref.helper';
import {
  DteFile,
  DteItemData,
  DteRejection,
  DteRelationData,
  DteTotals,
  DteWarning,
  ParsedDte,
  PurchaseDocumentType,
} from '../interfaces/purchase.interface';

type JsonObject = { [key: string]: unknown };

const DTE_TYPES: Record<string, PurchaseDocumentType> = {
  '03': 'CREDITO_FISCAL',
  '05': 'NOTA_CREDITO',
};

const PRODUCTION_ENVIRONMENT = '01';
const IVA_TRIBUTE_CODE = '20';
const IVA_RATE = 0.13;
const ELECTRONIC_GENERATION = 2;

// Señal interna para cortar el parseo cuando falta un campo obligatorio
class StructureError extends Error {}

// Lee un DTE (JSON de Hacienda) y lo valida. Ver docs/compras-dte.md
export class DteParser {
  // Deja solo los dígitos (los NRC y NIT a veces vienen con guiones)
  static normalizeId(value: string): string {
    return value.replace(/\D/g, '');
  }

  static parse(file: DteFile, receiverNrcs: string[]): [DteRejection, undefined] | [undefined, ParsedDte] {
    let json: unknown;
    try {
      json = JSON.parse(this.decode(file.content));
    } catch {
      return [{ reason: 'INVALID_JSON', message: 'File is not valid JSON' }, undefined];
    }

    if (!this.isObject(json)) return [this.structureRejection('root must be an object'), undefined];

    const { identificacion, emisor, receptor, resumen, cuerpoDocumento } = json;
    if (!this.isObject(identificacion) || !this.isObject(emisor) || !this.isObject(receptor) || !this.isObject(resumen) || !Array.isArray(cuerpoDocumento)) {
      return [this.structureRejection('missing identificacion, emisor, receptor, resumen or cuerpoDocumento'), undefined];
    }

    const tipoDte = this.str(identificacion.tipoDte);
    const type = tipoDte ? DTE_TYPES[tipoDte] : undefined;
    if (!type) {
      return [{ reason: 'UNSUPPORTED_TYPE', message: `Document type ${tipoDte ?? '(none)'} is not supported. Only 03 (crédito fiscal) and 05 (nota de crédito)` }, undefined];
    }

    if (this.str(identificacion.ambiente) !== PRODUCTION_ENVIRONMENT) {
      return [{ reason: 'TEST_ENVIRONMENT', message: 'Document belongs to the test environment' }, undefined];
    }

    // El sello viene en la raíz o dentro de respuestaHacienda, según el sistema del emisor
    const haciendaResponse = this.isObject(json.respuestaHacienda) ? json.respuestaHacienda : undefined;
    const receptionStamp = this.str(json.selloRecibido) ?? this.str(haciendaResponse?.selloRecibido);
    if (!receptionStamp) {
      return [{ reason: 'MISSING_STAMP', message: 'Document has no Hacienda reception stamp (selloRecibido)' }, undefined];
    }

    const receiverNrc = this.normalizeId(this.str(receptor.nrc) ?? '');
    if (!receiverNrcs.map((nrc) => this.normalizeId(nrc)).includes(receiverNrc)) {
      return [{ reason: 'RECEIVER_MISMATCH', message: `Receiver NRC ${receiverNrc || '(none)'} is not configured in RECEIVER_NRCS` }, undefined];
    }

    try {
      const totals = this.parseTotals(resumen);
      const items = cuerpoDocumento.map((item) => this.parseItem(item));
      const relations = type === 'NOTA_CREDITO' ? this.parseRelations(json.documentoRelacionado) : [];

      const parsed: ParsedDte = {
        type,
        generationCode: this.required(this.str(identificacion.codigoGeneracion), 'identificacion.codigoGeneracion').toUpperCase(),
        controlNumber: this.required(this.str(identificacion.numeroControl), 'identificacion.numeroControl'),
        receptionStamp,
        schemaVersion: this.required(this.int(identificacion.version), 'identificacion.version'),
        issueDate: this.date(identificacion.fecEmi, 'identificacion.fecEmi'),
        issueTime: this.str(identificacion.horEmi) ?? '',
        currency: this.str(identificacion.tipoMoneda) ?? 'USD',
        receiverNrc,
        operationCondition: this.required(this.int(resumen.condicionOperacion), 'resumen.condicionOperacion'),
        totals,
        supplier: {
          nit: this.normalizeId(this.required(this.str(emisor.nit), 'emisor.nit')),
          nrc: this.str(emisor.nrc),
          name: this.required(this.str(emisor.nombre), 'emisor.nombre'),
          commercialName: this.str(emisor.nombreComercial),
          activityCode: this.str(emisor.codActividad),
          activityDescription: this.str(emisor.descActividad),
          phone: this.str(emisor.telefono),
          email: this.str(emisor.correo),
        },
        items,
        relations,
        warnings: [
          ...this.haciendaWarnings(haciendaResponse),
          ...this.totalsWarnings(totals, items, resumen),
        ],
        rawJson: json,
      };

      return [undefined, parsed];
    } catch (error) {
      if (error instanceof StructureError) return [this.structureRejection(error.message), undefined];
      throw error;
    }
  }

  // UTF-8 (quitando el BOM); si no es UTF-8 válido, Latin-1 (lo usan algunos emisores)
  private static decode(content: Uint8Array): string {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(content);
    } catch {
      return new TextDecoder('latin1').decode(content);
    }
  }

  private static parseTotals(resumen: JsonObject): DteTotals {
    const tributes = Array.isArray(resumen.tributos) ? resumen.tributos : [];
    const ivaTribute = tributes.find((tribute) => this.isObject(tribute) && this.str(tribute.codigo) === IVA_TRIBUTE_CODE);

    const operationTotal = this.required(this.num(resumen.montoTotalOperacion), 'resumen.montoTotalOperacion');
    const ivaPerceived = this.num(resumen.ivaPerci1) ?? 0;
    const ivaWithheld = this.num(resumen.ivaRete1) ?? 0;
    const incomeTaxWithheld = this.num(resumen.reteRenta) ?? 0;

    return {
      nonSubjectTotal: this.num(resumen.totalNoSuj) ?? 0,
      exemptTotal: this.num(resumen.totalExenta) ?? 0,
      taxedTotal: this.required(this.num(resumen.totalGravada), 'resumen.totalGravada'),
      discountTotal: this.num(resumen.totalDescu) ?? 0,
      subtotal: this.num(resumen.subTotal) ?? 0,
      ivaAmount: this.isObject(ivaTribute) ? this.num(ivaTribute.valor) ?? 0 : 0,
      ivaPerceived,
      ivaWithheld,
      incomeTaxWithheld,
      operationTotal,
      // Las notas de crédito no traen totalPagar: el total se calcula igual para todos los tipos
      total: this.round2(operationTotal + ivaPerceived - ivaWithheld - incomeTaxWithheld),
    };
  }

  private static parseItem(item: unknown): DteItemData {
    if (!this.isObject(item)) throw new StructureError('cuerpoDocumento items must be objects');

    const code = this.str(item.codigo);
    const description = this.required(this.str(item.descripcion), 'cuerpoDocumento.descripcion');
    const product = ProductRefHelper.extract(code, description);

    return {
      itemNumber: this.required(this.int(item.numItem), 'cuerpoDocumento.numItem'),
      itemType: this.required(this.int(item.tipoItem), 'cuerpoDocumento.tipoItem'),
      code,
      description,
      quantity: this.required(this.num(item.cantidad), 'cuerpoDocumento.cantidad'),
      unitOfMeasure: this.required(this.int(item.uniMedida), 'cuerpoDocumento.uniMedida'),
      unitPrice: this.required(this.num(item.precioUni), 'cuerpoDocumento.precioUni'),
      discount: this.num(item.montoDescu) ?? 0,
      nonSubjectSale: this.num(item.ventaNoSuj) ?? 0,
      exemptSale: this.num(item.ventaExenta) ?? 0,
      taxedSale: this.num(item.ventaGravada) ?? 0,
      relatedDocumentCode: this.str(item.numeroDocumento),
      productRef: product.ref,
      productName: product.name,
    };
  }

  private static parseRelations(value: unknown): DteRelationData[] {
    if (value === null || value === undefined) return [];
    if (!Array.isArray(value)) throw new StructureError('documentoRelacionado must be an array');

    return value.map((relation) => {
      if (!this.isObject(relation)) throw new StructureError('documentoRelacionado items must be objects');

      const generationType = this.required(this.int(relation.tipoGeneracion), 'documentoRelacionado.tipoGeneracion');
      const number = this.required(this.str(relation.numeroDocumento), 'documentoRelacionado.numeroDocumento');

      return {
        relatedType: this.required(this.str(relation.tipoDocumento), 'documentoRelacionado.tipoDocumento'),
        generationType,
        // Los documentos electrónicos se identifican por su código de generación (en mayúsculas)
        relatedDocumentNumber: generationType === ELECTRONIC_GENERATION ? number.toUpperCase() : number,
        relatedIssueDate: this.date(relation.fechaEmision, 'documentoRelacionado.fechaEmision'),
      };
    });
  }

  // "RECIBIDO CON OBSERVACIONES": Hacienda lo aceptó (tiene sello) pero señaló algo del emisor
  private static haciendaWarnings(response: JsonObject | undefined): DteWarning[] {
    if (!response) return [];

    const raw = response.observaciones;
    const observations = Array.isArray(raw)
      ? raw.map((value) => String(value).trim()).filter(Boolean).join('; ')
      : (this.str(raw) ?? '');
    if (!observations || observations === '[]') return [];

    const status = this.str(response.descripcionMsg) ?? 'Recibido con observaciones';
    return [{ code: 'MH_OBSERVATIONS', message: `${status}: ${observations}` }];
  }

  // Tolerancia de $0.01: se comparan en centavos
  private static totalsWarnings(totals: DteTotals, items: DteItemData[], resumen: JsonObject): DteWarning[] {
    const warnings: DteWarning[] = [];
    const differs = (a: number, b: number) => Math.abs(Math.round(a * 100) - Math.round(b * 100)) > 1;

    const taxedBase = totals.taxedTotal - (this.num(resumen.descuGravada) ?? 0);
    const expectedIva = this.round2(taxedBase * IVA_RATE);
    if (differs(totals.ivaAmount, expectedIva)) {
      warnings.push({ code: 'TOTALS_MISMATCH', message: `IVA ${totals.ivaAmount} is not 13% of the taxed amount (expected ${expectedIva})` });
    }

    const itemsTaxed = this.round2(items.reduce((sum, item) => sum + item.taxedSale, 0));
    if (differs(itemsTaxed, totals.taxedTotal)) {
      warnings.push({ code: 'TOTALS_MISMATCH', message: `Items taxed sum ${itemsTaxed} does not match totalGravada ${totals.taxedTotal}` });
    }

    const totalToPay = this.num(resumen.totalPagar);
    if (totalToPay !== null && differs(totalToPay, totals.total)) {
      warnings.push({ code: 'TOTALS_MISMATCH', message: `totalPagar ${totalToPay} does not match the calculated total ${totals.total}` });
    }

    return warnings;
  }

  private static structureRejection(detail: string): DteRejection {
    return { reason: 'INVALID_STRUCTURE', message: `File is not a valid DTE: ${detail}` };
  }

  private static required<T>(value: T | null, field: string): T {
    if (value === null) throw new StructureError(`${field} is required`);
    return value;
  }

  private static date(value: unknown, field: string): string {
    if (!DateHelper.isValidDate(value)) throw new StructureError(`${field} must be a valid date (YYYY-MM-DD)`);
    return value;
  }

  private static isObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private static str(value: unknown): string | null {
    if (typeof value === 'number') return String(value);
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  private static num(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private static int(value: unknown): number | null {
    const number = this.num(value);
    return number !== null && Number.isInteger(number) ? number : null;
  }

  private static round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
