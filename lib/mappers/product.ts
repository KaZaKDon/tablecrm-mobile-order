import type { ProductItem } from "@/types/tablecrm";

type ProductRow = {
  id?: number | string;
  nomenclature?: number | string;
  name?: string;
  nomenclature_name?: string;
  article?: string;
  code?: string;

  price?: number | string | null;
  quantity?: number | string | null;

  unit?: number | string | null;
  unit_name?: string | null;

  price_type?: number | string | null;
  tax?: number | string | null;
  discount?: number | string | null;
  sum_discounted?: number | string | null;
  status?: string | null;
};

export function mapProduct(row: ProductRow, selectedPriceTypeId?: number | null): ProductItem {
  const price = Number(row.price ?? 0);
  const quantity = Number(row.quantity ?? 1);

  return {
    id: Number(row.id ?? row.nomenclature ?? 0),
    name: row.name ?? row.nomenclature_name ?? "Без названия",
    article: row.article ?? row.code ?? "",
    price,
    quantity: quantity > 0 ? quantity : 1,

    unitId: row.unit != null && row.unit !== "" ? Number(row.unit) : 116,
    unitName: row.unit_name ?? null,

    priceTypeId:
      row.price_type != null && row.price_type !== ""
        ? Number(row.price_type)
        : (selectedPriceTypeId ?? null),

    tax: row.tax != null ? Number(row.tax) : 0,
    discount: row.discount != null ? Number(row.discount) : 0,
    sumDiscounted:
      row.sum_discounted != null
        ? Number(row.sum_discounted)
        : price * (quantity > 0 ? quantity : 1),

    status: row.status ?? null,

    raw: row,
  };
}