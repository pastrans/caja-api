import { ProductSupplierFilterDto } from '../../dtos';
import { PurchaseProductRepository } from '../../repositories';
import { ProductMergeSuggestion, ProductSummary } from '../../interfaces/purchase-product.interface';
import { ProductNameHelper, ProductPriceHelper } from '../../helpers/product-price.helper';

const ALL_TIME_FROM = '2000-01-01';
const ALL_TIME_TO = '2999-12-31';

export interface GetProductMergeSuggestionsUseCase {
  execute(dto: ProductSupplierFilterDto): Promise<ProductMergeSuggestion[]>;
}

// Productos del mismo proveedor cuyo nombre normalizado coincide (ver ProductNameHelper.signature).
// Se calculan sobre todo el historial y con las variantes ya unidas, así que lo que ya se unió no se vuelve a sugerir
export class GetProductMergeSuggestions implements GetProductMergeSuggestionsUseCase {
  constructor(private readonly repository: PurchaseProductRepository) {}

  async execute(dto: ProductSupplierFilterDto): Promise<ProductMergeSuggestion[]> {
    const [rows, dismissed] = await Promise.all([
      this.repository.getPricePoints({ from: ALL_TIME_FROM, to: ALL_TIME_TO, supplierId: dto.supplierId, products: null, resolveVariants: true }),
      this.repository.getDismissedSuggestions(),
    ]);
    const dismissedKeys = new Set(dismissed.map((d) => `${d.supplierId}|${d.signature}`));

    const groups = new Map<string, { supplierId: number; supplierName: string; signature: string; products: ProductSummary[] }>();
    for (const productRows of ProductPriceHelper.groupByProduct(rows).values()) {
      const summary = ProductPriceHelper.summary(productRows);
      const { supplierId, supplierName } = productRows[0]!;
      const signature = ProductNameHelper.signature(summary.name);
      if (!signature) continue;

      const groupKey = `${supplierId}|${signature}`;
      if (dismissedKeys.has(groupKey)) continue;

      const group = groups.get(groupKey) ?? { supplierId, supplierName, signature, products: [] };
      group.products.push(summary);
      groups.set(groupKey, group);
    }

    return [...groups.values()]
      .map((group) => {
        // El principal sugerido es el más comprado (con el nombre del más reciente se pierde el producto real:
        // Avícola facturó un par de veces por bolsa lo que siempre factura por libra)
        const ranked = group.products.sort((a, b) => b.purchases - a.purchases || b.lastDate.localeCompare(a.lastDate));
        const main = ranked[0]!;
        const products = ranked.filter((p) => p.unitOfMeasure === main.unitOfMeasure || comparablePrices(p.lastPrice, main.lastPrice));
        return {
          supplierId: group.supplierId,
          supplierName: group.supplierName,
          signature: group.signature,
          suggestedKey: main.key,
          sameUnit: new Set(products.map((p) => p.unitOfMeasure)).size === 1,
          products,
        };
      })
      .filter((suggestion) => suggestion.products.length > 1)
      .sort((a, b) => total(b) - total(a));
  }
}

// Con otra unidad de medida solo se sugiere si el precio es parecido (San Valentín usa 59 y 99 para lo mismo);
// si no, es otra forma de vender el producto (por bolsa vs. por libra) y unirlos mezclaría precios
const MAX_PRICE_RATIO = 1.5;
const comparablePrices = (a: number, b: number) => a > 0 && b > 0 && Math.max(a, b) / Math.min(a, b) <= MAX_PRICE_RATIO;

const total = (suggestion: ProductMergeSuggestion) => suggestion.products.reduce((sum, p) => sum + p.purchases, 0);
