import { DateHelper } from '../../helpers/date.helper';
import { ProductKeyHelper } from '../../helpers/product-price.helper';
import { PurchaseProductSort } from '../../interfaces/purchase-product.interface';

const MAX_MONTHS = 120;
const DEFAULT_MONTHS = 12;
const ALL_TIME_FROM = '2000-01-01';
const SORTS: PurchaseProductSort[] = ['spent', 'change', 'trend', 'name', 'recent'];

// Periodo del análisis: los últimos N meses hasta hoy (zona del negocio). months=all usa todo el historial
const parsePeriod = (months: unknown, timezone: string): [string, undefined] | [undefined, { months: number | null; from: string; to: string }] => {
  const to = DateHelper.today(timezone);
  if (months === 'all') return [undefined, { months: null, from: ALL_TIME_FROM, to }];

  const value = months === undefined ? DEFAULT_MONTHS : Number(months);
  if (!Number.isInteger(value) || value < 1 || value > MAX_MONTHS) {
    return [`months must be an integer between 1 and ${MAX_MONTHS}, or "all"`, undefined];
  }
  return [undefined, { months: value, from: DateHelper.subtractMonths(to, value), to }];
};

export class PurchaseProductsDto {
  private constructor(
    public readonly months: number | null,
    public readonly from: string,
    public readonly to: string,
    public readonly supplierId: number | null,
    public readonly search: string | null,
    public readonly sort: PurchaseProductSort,
    public readonly order: 'asc' | 'desc',
  ) {}

  static create(props: { [key: string]: any }, timezone: string): [string, undefined] | [undefined, PurchaseProductsDto] {
    const { months, supplierId, search, sort, order } = props;

    const [periodError, period] = parsePeriod(months, timezone);
    if (periodError) return [periodError, undefined];

    let supplier: number | null = null;
    if (supplierId !== undefined) {
      supplier = Number(supplierId);
      if (!Number.isInteger(supplier) || supplier <= 0) return ['supplierId must be a positive integer', undefined];
    }

    if (search !== undefined && typeof search !== 'string') return ['search must be a string', undefined];

    const sortValue = (sort ?? 'spent') as PurchaseProductSort;
    if (!SORTS.includes(sortValue)) return [`sort must be one of: ${SORTS.join(', ')}`, undefined];

    // Por defecto: alfabético para el nombre, de mayor a menor para lo demás
    const orderValue = order ?? (sortValue === 'name' ? 'asc' : 'desc');
    if (orderValue !== 'asc' && orderValue !== 'desc') return ['order must be asc or desc', undefined];

    return [undefined, new PurchaseProductsDto(period!.months, period!.from, period!.to, supplier, search?.trim() || null, sortValue, orderValue)];
  }
}

export class PurchaseProductHistoryDto {
  private constructor(
    public readonly key: string,
    public readonly supplierId: number,
    public readonly unitOfMeasure: number,
    public readonly ref: string,
    public readonly months: number | null,
    public readonly from: string,
    public readonly to: string,
  ) {}

  static create(props: { [key: string]: any }, timezone: string): [string, undefined] | [undefined, PurchaseProductHistoryDto] {
    const { key, months } = props;

    const parsed = ProductKeyHelper.parse(key);
    if (!parsed) return ['key must have the form supplierId:unitOfMeasure:ref', undefined];

    const [periodError, period] = parsePeriod(months, timezone);
    if (periodError) return [periodError, undefined];

    return [undefined, new PurchaseProductHistoryDto(key, parsed.supplierId, parsed.unitOfMeasure, parsed.ref, period!.months, period!.from, period!.to)];
  }
}

const MAX_VARIANTS_PER_MERGE = 50;
const MAX_SIGNATURE_LENGTH = 300;

const parseSupplierFilter = (supplierId: unknown): [string, undefined] | [undefined, number | null] => {
  if (supplierId === undefined) return [undefined, null];
  const value = Number(supplierId);
  if (!Number.isInteger(value) || value <= 0) return ['supplierId must be a positive integer', undefined];
  return [undefined, value];
};

// Filtro opcional por proveedor (sugerencias y uniones guardadas)
export class ProductSupplierFilterDto {
  private constructor(public readonly supplierId: number | null) {}

  static create(props: { [key: string]: any }): [string, undefined] | [undefined, ProductSupplierFilterDto] {
    const [error, supplierId] = parseSupplierFilter(props.supplierId);
    if (error) return [error, undefined];
    return [undefined, new ProductSupplierFilterDto(supplierId!)];
  }
}

// Une variantes a un producto principal: todos del mismo proveedor
export class MergeProductsDto {
  private constructor(
    public readonly supplierId: number,
    public readonly target: { unitOfMeasure: number; ref: string },
    public readonly variants: { unitOfMeasure: number; ref: string }[],
    public readonly userId: number,
  ) {}

  static create(props: { [key: string]: any }): [string, undefined] | [undefined, MergeProductsDto] {
    const { targetKey, variantKeys, userId } = props;

    const target = ProductKeyHelper.parse(targetKey);
    if (!target) return ['targetKey must have the form supplierId:unitOfMeasure:ref', undefined];

    if (!Array.isArray(variantKeys) || variantKeys.length === 0) return ['variantKeys must be a non-empty array', undefined];
    if (variantKeys.length > MAX_VARIANTS_PER_MERGE) return [`variantKeys can have at most ${MAX_VARIANTS_PER_MERGE} items`, undefined];

    const variants = [];
    for (const key of new Set(variantKeys)) {
      const variant = ProductKeyHelper.parse(key);
      if (!variant) return ['each variantKey must have the form supplierId:unitOfMeasure:ref', undefined];
      if (variant.supplierId !== target.supplierId) return ['all products must belong to the same supplier', undefined];
      if (variant.unitOfMeasure === target.unitOfMeasure && variant.ref === target.ref) return ['a product cannot be a variant of itself', undefined];
      variants.push({ unitOfMeasure: variant.unitOfMeasure, ref: variant.ref });
    }

    return [undefined, new MergeProductsDto(
      target.supplierId,
      { unitOfMeasure: target.unitOfMeasure, ref: target.ref },
      variants,
      userId,
    )];
  }
}

// Separa una variante de su producto principal
export class UnmergeProductDto {
  private constructor(
    public readonly supplierId: number,
    public readonly variant: { unitOfMeasure: number; ref: string },
  ) {}

  static create(props: { [key: string]: any }): [string, undefined] | [undefined, UnmergeProductDto] {
    const parsed = ProductKeyHelper.parse(props.key);
    if (!parsed) return ['key must have the form supplierId:unitOfMeasure:ref', undefined];
    return [undefined, new UnmergeProductDto(parsed.supplierId, { unitOfMeasure: parsed.unitOfMeasure, ref: parsed.ref })];
  }
}

// "No son el mismo producto": la sugerencia no se vuelve a mostrar
export class DismissProductSuggestionDto {
  private constructor(
    public readonly supplierId: number,
    public readonly signature: string,
    public readonly userId: number,
  ) {}

  static create(props: { [key: string]: any }): [string, undefined] | [undefined, DismissProductSuggestionDto] {
    const { supplierId, signature, userId } = props;

    const supplier = Number(supplierId);
    if (!Number.isInteger(supplier) || supplier <= 0) return ['supplierId must be a positive integer', undefined];

    if (typeof signature !== 'string' || !signature.trim()) return ['signature is required', undefined];
    if (signature.length > MAX_SIGNATURE_LENGTH) return [`signature must be at most ${MAX_SIGNATURE_LENGTH} characters`, undefined];

    return [undefined, new DismissProductSuggestionDto(supplier, signature.trim(), userId)];
  }
}
