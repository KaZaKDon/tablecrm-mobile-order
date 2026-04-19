import { getLineTotal } from "@/lib/mappers/product";
import type { OrderFormState } from "@/types/tablecrm";

export type SubmitMode = "draft" | "post";

function toUnixSeconds(date = Date.now()) {
  return Math.floor(date / 1000);
}

function toPaidRubles(value: number) {
  return Number.isInteger(value) ? value : value.toFixed(2);
}

export function buildSalePayload(state: OrderFormState, _mode: SubmitMode) {
  const total = state.items.reduce((sum, item) => {
    return sum + getLineTotal(Number(item.price), Number(item.quantity), Number(item.discount ?? 0));
  }, 0);

  const root: Record<string, unknown> = {
    priority: 0,
    dated: toUnixSeconds(),
    operation: "Заказ",
    tax_included: true,
    tax_active: true,
    goods: state.items.map((item) => ({
      price: Number(item.price),
      quantity: Number(item.quantity),
      unit: Number(item.unitId ?? 116),
      discount: Number(item.discount ?? 0),
      sum_discounted: Number(item.sumDiscounted ?? item.discount ?? 0),
      nomenclature: Number(item.id),
    })),
    settings: state.repeatability ?? {},
    warehouse: Number(state.warehouseId),
    contragent: state.client?.id ? Number(state.client.id) : null,
    paybox: Number(state.payboxId),
    organization: Number(state.organizationId),
    status: false,
    paid_rubles: toPaidRubles(Number(total.toFixed(2))),
    paid_lt: 0,
  };

  if (state.client?.loyalityCardId) {
    root.loyality_card_id = Number(state.client.loyalityCardId);
  }

  return [root];
}