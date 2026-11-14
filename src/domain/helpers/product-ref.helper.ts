// Código y nombre del producto de una línea del DTE. Se calculan al importar y se guardan en la línea.
// Las mismas reglas están en SQL en la migración 20261115000000_add_item_product_ref (para las líneas que ya
// existían); si cambian aquí, hay que recalcular las líneas guardadas. Detalle en docs/productos-api.md:
// 1. Con código propio (que no sea "PLU:"): el código en mayúsculas.
// 2. Código dentro de la descripción (Avícola Salvadoreña): "25003131|PLU:|ALIMIAU ADULTO 420 g|..." o el formato
//    anterior "43002523 |  | SALCHICHA ... | 10." → código = 1er campo, nombre = 3er campo (o el 2º si el 3º viene vacío).
// 3. Sin código: el texto antes del primer '|' en mayúsculas y con espacios normalizados (Hernández agrega a veces
//    el código de barras después del '|').
const DESCRIBED_CODE = /^\s*\d{6,}\s*\|/;

// btrim() de PostgreSQL: quita solo espacios, no tabs ni saltos de línea
const trimSpaces = (value: string) => value.replace(/^ +| +$/g, '');

export interface ProductRef {
  ref: string;
  name: string;
}

export class ProductRefHelper {
  static extract(code: string | null, description: string): ProductRef {
    const ownCode = code === null ? '' : trimSpaces(code);
    if (ownCode !== '' && ownCode !== 'PLU:') {
      return { ref: ownCode.toUpperCase(), name: trimSpaces(description) };
    }

    const parts = description.split('|');
    if (this.hasDescribedCode(description)) {
      const third = trimSpaces(parts[2] ?? '');
      return { ref: trimSpaces(parts[0]!), name: third !== '' ? third : trimSpaces(parts[1] ?? '') };
    }

    const first = trimSpaces(parts[0]!);
    return { ref: first.replace(/\s+/g, ' ').toUpperCase(), name: first };
  }

  // La línea trae el código del producto al inicio de la descripción (formato de Avícola Salvadoreña)
  static hasDescribedCode(description: string): boolean {
    return DESCRIBED_CODE.test(description);
  }
}
