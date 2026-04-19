import type { ProductItem } from "@/types/tablecrm";

export type ProductSearchItem = {
  id?: number | string;
  nomenclature?: number | string;
  nomenclature_id?: number | string;
  name?: string;
  nomenclature_name?: string;
  article?: string;
  code?: string;
  price?: number | string | null;
  quantity?: number | string | null;
  unit?: number | string | null;
  unit_id?: number | string | null;
  unit_name?: string | null;
  price_type?: number | string | null;
  price_type_id?: number | string | null;
  tax?: number | string | null;
  discount?: number | string | null;
  sum_discounted?: number | string | null;
  status?: string | null;
  raw?: unknown;
};

function toNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getLineTotal(price: number, quantity: number, discount = 0) {
  return price * quantity - discount;
}

export function mapProduct(
  row: ProductSearchItem,
  selectedPriceTypeId?: number | null,
): ProductItem {
  const price = toNumber(row.price, 0);
  const quantity = Math.max(1, toNumber(row.quantity, 1));
  const discount = Math.max(0, toNumber(row.discount ?? row.sum_discounted, 0));

  return {
    id: toNumber(row.id ?? row.nomenclature ?? row.nomenclature_id, 0),
    name: row.name ?? row.nomenclature_name ?? "Без названия",
    article: row.article ?? row.code ?? "",
    price,
    quantity,
    unitId:
      row.unit != null && row.unit !== ""
        ? toNumber(row.unit, 116)
        : row.unit_id != null && row.unit_id !== ""
          ? toNumber(row.unit_id, 116)
          : 116,
    unitName: row.unit_name ?? null,
    priceTypeId:
      row.price_type != null && row.price_type !== ""
        ? toNumber(row.price_type)
        : row.price_type_id != null && row.price_type_id !== ""
          ? toNumber(row.price_type_id)
          : (selectedPriceTypeId ?? null),
    tax: row.tax != null ? toNumber(row.tax) : 0,
    discount,
    sumDiscounted: discount,
    status: row.status ?? null,
    raw: row,
  };
}