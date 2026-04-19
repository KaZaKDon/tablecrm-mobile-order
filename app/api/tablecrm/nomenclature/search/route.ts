import { NextRequest, NextResponse } from "next/server";
import { tablecrmRequest } from "@/lib/tablecrm";

function pickArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function mapBaseItem(item: any, selectedPriceTypeId?: number | null) {
  return {
    id: toNumber(item.id ?? item.nomenclature ?? item.nomenclature_id, 0),
    name: item.name ?? item.nomenclature_name ?? "Без названия",
    article: item.article ?? item.code ?? "",
    unit: toNumber(item.unit ?? item.unit_id, 116),
    unit_name: item.unit_name ?? null,
    price: 0,
    price_type: selectedPriceTypeId ?? null,
    tax: toNumber(item.tax, 0),
    discount: toNumber(item.discount, 0),
    sum_discounted: toNumber(item.discount, 0),
    status: item.status ?? null,
    raw: item,
  };
}

function getPriceValue(row: any): number {
  return toNumber(row?.price ?? row?.value ?? row?.sale_price ?? row?.price_value ?? row?.sum ?? 0, 0);
}

function getRowNomenclatureId(row: any): number | null {
  const value = row?.nomenclature_id ?? row?.nomenclature ?? row?.product_id ?? row?.product ?? row?.item_id ?? null;
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function getRowPriceTypeId(row: any): number | null {
  const value = row?.price_type_id ?? row?.type_price_id ?? row?.price_type ?? row?.type_price ?? null;
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function pickBestPriceRow(rows: any[], nomenclatureId: number, priceTypeId?: number | null): any | null {
  if (!rows.length) return null;
  const exactByNomenclature = rows.filter((row) => getRowNomenclatureId(row) === nomenclatureId);
  if (exactByNomenclature.length === 0) return null;
  const byPriceType = priceTypeId != null ? exactByNomenclature.filter((row) => getRowPriceTypeId(row) === priceTypeId) : exactByNomenclature;
  const pool = byPriceType.length ? byPriceType : exactByNomenclature;
  const nonZero = pool.find((row) => getPriceValue(row) > 0);
  return nonZero ?? pool[0] ?? null;
}

function extractPriceFromEmbeddedPrices(item: any, nomenclatureId: number, priceTypeId?: number | null) {
  const embedded = pickArray(item?.prices);
  if (!embedded.length) return null;
  const row = pickBestPriceRow(embedded, nomenclatureId, priceTypeId);
  if (!row) return null;
  return {
    price: getPriceValue(row),
    price_type: priceTypeId ?? getRowPriceTypeId(row) ?? null,
  };
}

async function findPriceForNomenclature(token: string, item: any, nomenclatureId: number, priceTypeId?: number | null) {
  const embedded = extractPriceFromEmbeddedPrices(item, nomenclatureId, priceTypeId);
  if (embedded) return embedded;

  try {
    const raw = await tablecrmRequest<any>({
      token,
      path: "/prices/",
      query: {
        nomenclature: nomenclatureId,
        price_type: priceTypeId ?? undefined,
      },
    });

    const prices = pickArray(raw);
    const best = pickBestPriceRow(prices, nomenclatureId, priceTypeId);

    if (best) {
      return {
        price: getPriceValue(best),
        price_type: priceTypeId ?? getRowPriceTypeId(best) ?? null,
      };
    }
  } catch (error) {
    console.error("PRICE LOOKUP ERROR:", { nomenclatureId, priceTypeId, error });
  }

  return {
    price: 0,
    price_type: priceTypeId ?? null,
  };
}

function filterNomenclature(array: any[], search: string) {
  const term = normalizeText(search);
  const matched = array.filter((item) => {
    const name = normalizeText(item?.name ?? item?.nomenclature_name);
    const code = normalizeText(item?.code ?? item?.article);
    return name.includes(term) || code.includes(term);
  });
  const productOnly = matched.filter((item) => item?.type === "product");

  return (productOnly.length > 0 ? productOnly : matched).sort((a, b) => {
    const aName = normalizeText(a?.name);
    const bName = normalizeText(b?.name);
    const aExact = aName === term ? 1 : 0;
    const bExact = bName === term ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    const aStarts = aName.startsWith(term) ? 1 : 0;
    const bStarts = bName.startsWith(term) ? 1 : 0;
    if (aStarts !== bStarts) return bStarts - aStarts;
    return toNumber(b?.id, 0) - toNumber(a?.id, 0);
  });
}

export async function POST(request: NextRequest) {
  try {
    const { token, search, priceTypeId } = await request.json();
    if (!token) return NextResponse.json({ message: "Token is required" }, { status: 400 });

    const term = search?.trim() ?? "";
    const raw = await tablecrmRequest<any>({
      token,
      path: "/nomenclature/",
      query: {
        search: term || undefined,
      },
    });

    const array = pickArray(raw);
    const filtered = term ? filterNomenclature(array, term) : array;
    const limited = filtered.slice(0, term ? 30 : 100);

    const items = await Promise.all(
      limited.map(async (item: any) => {
        const base = mapBaseItem(item, priceTypeId ?? null);
        const priceInfo = await findPriceForNomenclature(token, item, base.id, priceTypeId ?? null);
        const price = toNumber(priceInfo.price, 0);

        return {
          ...base,
          price,
          price_type: priceInfo.price_type ?? base.price_type,
          sum_discounted: base.discount,
        };
      }),
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("NOMENCLATURE SEARCH ERROR:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to search nomenclature" }, { status: 500 });
  }
}