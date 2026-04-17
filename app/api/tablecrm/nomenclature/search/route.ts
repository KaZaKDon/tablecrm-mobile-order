import { NextRequest, NextResponse } from "next/server";
import { tablecrmRequest } from "@/lib/tablecrm";

function pickArray(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function mapBaseItem(item: any, selectedPriceTypeId?: number | null) {
  return {
    id: Number(item.id ?? item.nomenclature ?? 0),
    name: item.name ?? item.nomenclature_name ?? "Без названия",
    article: item.article ?? item.code ?? "",
    unit: item.unit ?? item.unit_id ?? 116,
    unit_name: item.unit_name ?? null,
    price: 0,
    price_type: selectedPriceTypeId ?? null,
    tax: item.tax ?? 0,
    discount: item.discount ?? 0,
    sum_discounted: item.sum_discounted ?? 0,
    status: item.status ?? null,
    raw: item,
  };
}

async function findPriceForNomenclature(
  token: string,
  nomenclatureId: number,
  priceTypeId?: number | null,
) {
  // Вариант A: ищем по nomenclature + price_type
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
    if (prices.length > 0) {
      const first = prices[0];
      return {
        price:
          Number(first.price ?? first.value ?? first.sale_price ?? 0),
        price_type:
          Number(first.price_type ?? priceTypeId ?? 0) || null,
      };
    }
  } catch {
    // молча пробуем fallback
  }

  return {
    price: 0,
    price_type: priceTypeId ?? null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { token, search, priceTypeId } = await request.json();

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }

    if (!search?.trim()) {
      return NextResponse.json({ items: [] });
    }

    const term = search.trim();

    const raw = await tablecrmRequest<any>({
      token,
      path: "/nomenclature/",
      query: {
        search: term,
      },
    });

    const array = pickArray(raw);

    const limited = array.slice(0, 30);

    const items = await Promise.all(
      limited.map(async (item: any) => {
        const base = mapBaseItem(item, priceTypeId ?? null);
        const priceInfo = await findPriceForNomenclature(
          token,
          base.id,
          priceTypeId ?? null,
        );

        const price = Number(priceInfo.price ?? 0);

        return {
          ...base,
          price,
          price_type: priceInfo.price_type ?? base.price_type,
          sum_discounted: price,
        };
      }),
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("NOMENCLATURE SEARCH ERROR:", error);

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to search nomenclature" },
      { status: 500 },
    );
  }
}