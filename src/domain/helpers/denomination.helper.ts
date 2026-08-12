export interface DenominationItem {
  value: number;
  quantity: number;
}

export class DenominationHelper {
  // Suma el total de multiplicación (valor * cantidad)
  static calculateTotal(denominations: DenominationItem[]): number {
    return denominations.reduce((acc, item) => acc + item.value * item.quantity, 0);
  }

  // Valida estructura y coincidencia con el efectivo esperado
  static validateSum(cash: number, denominations?: DenominationItem[]): string | null {
    if (!denominations || denominations.length === 0) return null;

    for (const item of denominations) {
      if (typeof item.value !== 'number' || item.value <= 0) {
        return 'Each denomination value must be a positive number';
      }
      if (typeof item.quantity !== 'number' || item.quantity < 0 || !Number.isInteger(item.quantity)) {
        return 'Each denomination quantity must be a non-negative integer';
      }
    }

    // Redondeo a 2 decimales para evitar problemas de precisión flotante en JS
    const totalDenominations = Number(this.calculateTotal(denominations).toFixed(2));
    const totalCash = Number(cash.toFixed(2));

    if (totalDenominations !== totalCash) {
      return `The sum of denominations (${totalDenominations}) does not match the total cash provided (${totalCash})`;
    }

    return null;
  }
}