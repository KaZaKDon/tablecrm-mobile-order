import { NextRequest, NextResponse } from "next/server";
import { buildSalePayload, type SubmitMode } from "@/lib/payload";
import { tablecrmRequest } from "@/lib/tablecrm";
import type { OrderFormState } from "@/types/tablecrm";

export async function POST(request: NextRequest) {
  try {
    const { token, state, mode } = (await request.json()) as { token: string; state: OrderFormState; mode: SubmitMode };
    if (!token) return NextResponse.json({ message: "Token is required" }, { status: 400 });
    if (!state.organizationId || !state.payboxId || !state.warehouseId || !state.items?.length) {
      return NextResponse.json({ message: "Organization, paybox, warehouse and at least one product are required" }, { status: 400 });
    }
    const payload = buildSalePayload(state, mode);
    const result = await tablecrmRequest<any>({ token, method: "POST", path: "/docs_sales/", body: payload });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to create sale" }, { status: 500 });
  }
}
