import { SupplierProductHistory } from '../datasources/purchase-document.datasource';
import { DteWarning, ParsedDte } from '../interfaces/purchase.interface';
import { ProductRefHelper } from './product-ref.helper';

// Un proveedor "usa código en la descripción" si casi todas sus líneas lo traen (Avícola Salvadoreña: 100 %)
const MIN_LINES_FOR_FORMAT = 20;
const DESCRIBED_CODE_SHARE = 0.9;
const MAX_EXAMPLES = 3;

// Una unidad es inusual para un producto si fue menos del 10 % de sus compras anteriores: Avícola ya había
// facturado por bolsa un par de veces lo que factura por libra, así que "ya se usó" no alcanza
const MIN_USUAL_UNIT_SHARE = 0.1;

// Líneas que no cuentan en el análisis de precios (bonificaciones, ver purchase-product.datasource.impl)
const isBonus = (item: ParsedDte['items'][number]) =>
  item.unitPrice <= 0.01 ||
  item.taxedSale + item.exemptSale + item.nonSubjectSale <= 0 ||
  /^\(BONIFICACI/i.test(item.description);

const hasOwnCode = (code: string | null) => !!code && code.trim() !== '' && code.trim() !== 'PLU:';

// Avisos al importar cuando el análisis de precios va a ver un producto nuevo donde probablemente es el mismo
// de siempre. No se guardan en el documento: solo salen en la respuesta de la importación
export class ProductImportWarningsHelper {
  static compute(dte: ParsedDte, history: SupplierProductHistory): DteWarning[] {
    const warnings: DteWarning[] = [];

    // 1. El proveedor siempre manda el código en la descripción y esta línea no lo trae
    const usesDescribedCode = history.lines >= MIN_LINES_FOR_FORMAT
      && history.describedCodeLines / history.lines >= DESCRIBED_CODE_SHARE;
    if (usesDescribedCode) {
      const unformatted = dte.items.filter((item) => !hasOwnCode(item.code) && !ProductRefHelper.hasDescribedCode(item.description));
      if (unformatted.length > 0) {
        warnings.push({
          code: 'PRODUCT_FORMAT_CHANGED',
          message: `${unformatted.length} line(s) do not start with the product code like this supplier's previous lines, `
            + `so they will be analyzed as new products: ${this.examples(unformatted.map((item) => `"${item.description}"`))}`,
        });
      }
    }

    // 2. Un producto que ya se compraba llega en una unidad de medida inusual (Avícola facturó por bolsa lo que factura por libra)
    if (dte.type === 'CREDITO_FISCAL') {
      const changed = new Map<string, string>();
      for (const item of dte.items) {
        const known = history.units[item.productRef];
        if (!known || isBonus(item) || changed.has(item.productRef)) continue;

        const total = known.reduce((sum, u) => sum + u.lines, 0);
        const sameUnit = known.find((u) => u.unit === item.unitOfMeasure)?.lines ?? 0;
        if (sameUnit / total >= MIN_USUAL_UNIT_SHARE) continue;

        const usual = [...known].sort((a, b) => b.lines - a.lines)[0]!;
        changed.set(item.productRef, `${item.productRef} "${item.productName}" in unit ${item.unitOfMeasure} (usually ${usual.unit}: ${usual.lines} of ${total} purchases)`);
      }
      if (changed.size > 0) {
        warnings.push({
          code: 'PRODUCT_UNIT_CHANGED',
          message: `${changed.size} product(s) were billed in a different unit of measure than before, `
            + `so their prices are analyzed separately: ${this.examples([...changed.values()])}`,
        });
      }
    }

    return warnings;
  }

  // Códigos de producto de los que hace falta saber con qué unidades se compraron
  static productRefs(dte: ParsedDte): string[] {
    return dte.type === 'CREDITO_FISCAL' ? [...new Set(dte.items.map((item) => item.productRef))] : [];
  }

  private static examples(values: string[]): string {
    const shown = values.slice(0, MAX_EXAMPLES).join('; ');
    return values.length > MAX_EXAMPLES ? `${shown}; and ${values.length - MAX_EXAMPLES} more` : shown;
  }
}
