import { PurchaseReportDto } from '../../dtos';
import { PurchaseProductRepository } from '../../repositories';
import {
  ProductReturnItem,
  ProductReturnsSummary,
  ReturnedProduct,
} from '../../interfaces/purchase-product.interface';
import { ProductKeyHelper, ProductReturnHelper } from '../../helpers/product-price.helper';

export interface ProductReturnsReport {
  from: string;
  to: string;
  supplierId: number | null;
  summary: ProductReturnsSummary;
  products: ReturnedProduct[]; // De mayor a menor monto devuelto
  items: ProductReturnItem[];  // De la más reciente a la más antigua
}

export interface GetProductReturnsUseCase {
  execute(dto: PurchaseReportDto): Promise<ProductReturnsReport>;
}

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor || 0;
};

// Devoluciones de producto por la fecha de la nota de crédito. Solo las líneas relacionadas con un producto comprado:
// la merma (descuento por factura) no cuenta como devolución
export class GetProductReturns implements GetProductReturnsUseCase {
  constructor(private readonly repository: PurchaseProductRepository) {}

  async execute(dto: PurchaseReportDto): Promise<ProductReturnsReport> {
    const filters = { from: dto.from, to: dto.to, supplierId: dto.supplierId, products: null, resolveVariants: true };
    const [rows, purchasedAmount] = await Promise.all([
      this.repository.getReturns(filters, 'return'),
      this.repository.getPurchasedAmount(dto.from, dto.to, dto.supplierId),
    ]);

    const items: ProductReturnItem[] = rows.map((row) => {
      const type = ProductReturnHelper.type(row);
      return {
        date: row.issueDate,
        documentId: row.documentId,
        controlNumber: row.controlNumber,
        purchaseDocumentId: row.purchaseDocumentId,
        purchaseControlNumber: row.purchaseControlNumber,
        purchaseDate: row.purchaseDate,
        productKey: ProductKeyHelper.build(row.supplierId, row.unitOfMeasure, row.ref),
        productName: row.name,
        unitOfMeasure: row.unitOfMeasure,
        type,
        quantity: type === 'return' ? round(row.quantity, 4) : 0,
        amount: round(row.amount, 2),
      };
    });

    const amount = items.reduce((sum, item) => sum + item.amount, 0);

    const byProduct = new Map<string, { items: ProductReturnItem[]; latest: ProductReturnItem }>();
    for (const item of items) {
      const group = byProduct.get(item.productKey);
      if (!group) byProduct.set(item.productKey, { items: [item], latest: item });
      else {
        group.items.push(item);
        if (item.purchaseDate > group.latest.purchaseDate) group.latest = item;
      }
    }

    const products: ReturnedProduct[] = [...byProduct.entries()]
      .map(([key, group]) => {
        const productAmount = group.items.reduce((sum, item) => sum + item.amount, 0);
        return {
          key,
          name: group.latest.productName, // El nombre de la compra más reciente
          ref: ProductKeyHelper.parse(key)!.ref,
          unitOfMeasure: group.latest.unitOfMeasure,
          returns: group.items.length,
          purchases: new Set(group.items.map((item) => item.purchaseDocumentId)).size,
          quantity: round(group.items.reduce((sum, item) => sum + item.quantity, 0), 4),
          amount: round(productAmount, 2),
          percentage: amount > 0 ? round((productAmount / amount) * 100, 2) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'es'));

    return {
      from: dto.from,
      to: dto.to,
      supplierId: dto.supplierId,
      summary: {
        amount: round(amount, 2),
        returns: items.filter((item) => item.type === 'return').length,
        priceReductions: items.filter((item) => item.type === 'price').length,
        creditNotes: new Set(items.map((item) => item.documentId)).size,
        products: products.length,
        purchasedAmount: round(purchasedAmount, 2),
        percentage: purchasedAmount > 0 ? round((amount / purchasedAmount) * 100, 2) : 0,
      },
      products,
      items: [...items].sort((a, b) => b.date.localeCompare(a.date) || b.documentId - a.documentId),
    };
  }
}
