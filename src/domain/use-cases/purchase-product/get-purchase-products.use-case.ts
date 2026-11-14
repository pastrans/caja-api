import { PaginationDto, PurchaseProductsDto } from '../../dtos';
import { PurchaseProductRepository } from '../../repositories';
import { PaginatedResponse } from '../../interfaces/paginated-response.interface';
import { ProductPriceStats, ProductsTrendSummary } from '../../interfaces/purchase-product.interface';
import { PaginationHelper } from '../../helpers/pagination.helper';
import { ProductPriceHelper } from '../../helpers/product-price.helper';

export interface PurchaseProductsResponse extends PaginatedResponse<ProductPriceStats> {
  months: number | null;
  from: string;
  to: string;
  supplierId: number | null;
  summary: ProductsTrendSummary; // De todos los productos que cumplen los filtros, no solo de la página
}

export interface GetPurchaseProductsUseCase {
  execute(dto: PurchaseProductsDto, paginationDto: PaginationDto): Promise<PurchaseProductsResponse>;
}

// Sin acentos y en minúsculas, para que "pechuga" encuentre "PECHUGA" y "jamon" encuentre "JAMÓN"
const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export class GetPurchaseProducts implements GetPurchaseProductsUseCase {
  constructor(
    private readonly repository: PurchaseProductRepository,
    private readonly path: string = '/api/v1/purchase-products'
  ) {}

  async execute(dto: PurchaseProductsDto, paginationDto: PaginationDto): Promise<PurchaseProductsResponse> {
    const rows = await this.repository.getPricePoints({ from: dto.from, to: dto.to, supplierId: dto.supplierId, product: null });

    let products = [...ProductPriceHelper.groupByProduct(rows).values()].map((group) => ProductPriceHelper.stats(group));

    if (dto.search) {
      const term = normalize(dto.search);
      products = products.filter((p) => normalize(`${p.name} ${p.ref} ${p.supplierName}`).includes(term));
    }

    const summary: ProductsTrendSummary = {
      products: products.length,
      rising: products.filter((p) => p.trend?.direction === 'up').length,
      falling: products.filter((p) => p.trend?.direction === 'down').length,
      flat: products.filter((p) => p.trend?.direction === 'flat').length,
      insufficient: products.filter((p) => p.trend === null).length,
    };

    products.sort(this.comparator(dto));

    const { page, limit } = paginationDto;
    const pageItems = products.slice((page - 1) * limit, page * limit);

    return {
      months: dto.months,
      from: dto.from,
      to: dto.to,
      supplierId: dto.supplierId,
      summary,
      ...PaginationHelper.createResponse(pageItems, products.length, paginationDto, this.path),
    };
  }

  // Los productos sin tendencia van siempre al final al ordenar por tendencia
  private comparator(dto: PurchaseProductsDto): (a: ProductPriceStats, b: ProductPriceStats) => number {
    const direction = dto.order === 'asc' ? 1 : -1;
    switch (dto.sort) {
      case 'name':
        return (a, b) => direction * a.name.localeCompare(b.name, 'es');
      case 'change':
        return (a, b) => direction * (a.changePct - b.changePct);
      case 'recent':
        return (a, b) => direction * a.lastDate.localeCompare(b.lastDate);
      case 'trend':
        return (a, b) => {
          if (!a.trend || !b.trend) return (a.trend ? 0 : 1) - (b.trend ? 0 : 1);
          return direction * (a.trend.pctPerMonth - b.trend.pctPerMonth);
        };
      default:
        return (a, b) => direction * (a.spent - b.spent);
    }
  }
}
