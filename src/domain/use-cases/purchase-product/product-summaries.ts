import { ProductRef } from '../../datasources/purchase-product.datasource';
import { PurchaseProductRepository } from '../../repositories';
import { ProductSummary } from '../../interfaces/purchase-product.interface';
import { ProductPriceHelper } from '../../helpers/product-price.helper';

const ALL_TIME_FROM = '2000-01-01';
const ALL_TIME_TO = '2999-12-31';

// Resumen de todo el historial de productos de un proveedor, cada uno por separado (sin unir variantes).
// Sirve para mostrar qué se une o se separa. key: supplierId:unidad:código
export async function getProductSummaries(
  repository: PurchaseProductRepository,
  supplierId: number,
  products: ProductRef[],
): Promise<Map<string, ProductSummary>> {
  return (await getProductSummariesWithSupplier(repository, supplierId, products)).summaries;
}

export async function getProductSummariesWithSupplier(
  repository: PurchaseProductRepository,
  supplierId: number,
  products: ProductRef[],
): Promise<{ supplierName: string; summaries: Map<string, ProductSummary> }> {
  if (products.length === 0) return { supplierName: '', summaries: new Map() };

  const rows = await repository.getPricePoints({
    from: ALL_TIME_FROM,
    to: ALL_TIME_TO,
    supplierId,
    products,
    resolveVariants: false,
  });

  const summaries = new Map<string, ProductSummary>();
  for (const [key, group] of ProductPriceHelper.groupByProduct(rows)) {
    summaries.set(key, ProductPriceHelper.summary(group));
  }
  return { supplierName: rows[0]?.supplierName ?? '', summaries };
}
