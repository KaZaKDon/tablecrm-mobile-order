import { NextRequest, NextResponse } from "next/server";
import { mapOptionsFromResponse, tablecrmRequest } from "@/lib/tablecrm";
import { normalizePhone } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { token, phone } = await request.json();
    if (!token || !phone) return NextResponse.json({ message: "Token and phone are required" }, { status: 400 });
    const normalizedPhone = normalizePhone(phone);
    const result = await tablecrmRequest<any>({ token, path: "/contragents/", query: { phone: normalizedPhone, search: normalizedPhone } });
    const items = mapOptionsFromResponse(result).map((item: any) => ({ ...item, loyality_card_id: (item.raw as any)?.loyality_card_id ?? null }));
    return NextResponse.json({ items, first: items[0] ?? null });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to search client" }, { status: 500 });
  }
}
