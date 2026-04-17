import type { OrderFormState } from "@/types/tablecrm";

export type SubmitMode = "draft" | "post";

function toUnixSeconds(date = Date.now()) {
  return Math.floor(date / 1000);
}

export function buildSalePayload(state: OrderFormState, mode: SubmitMode) {
  const total = state.items.reduce((sum, item) => {
    const rowSum =
      item.sumDiscounted != null
        ? Number(item.sumDiscounted)
        : Number(item.price) * Number(item.quantity);

    return sum + rowSum;
  }, 0);

  return [
    {
      priority: 0,
      dated: toUnixSeconds(),
      operation: "Заказ",
      tax_included: true,
      tax_active: true,

      goods: state.items.map((item) => ({
        price_type: item.priceTypeId ?? state.priceTypeId ?? null,
        price: Number(item.price),
        quantity: Number(item.quantity),
        unit: Number(item.unitId ?? 116),
        discount: Number(item.discount ?? 0),
        sum_discounted:
          item.sumDiscounted != null
            ? Number(item.sumDiscounted)
            : Number(item.price) * Number(item.quantity),
        nomenclature: Number(item.id),

        // Эти поля можно оставить — они помогают совпасть с реальной моделью строки
        unit_name: item.unitName ?? "шт",
        tax: Number(item.tax ?? 0),
        status: item.status ?? "новый",
        nomenclature_name: item.name,
      })),

      settings: state.repeatability ?? {},

      ...(state.client?.loyalityCardId
        ? { loyality_card_id: Number(state.client.loyalityCardId) }
        : {}),

      warehouse: Number(state.warehouseId),
      contragent: state.client?.id ? Number(state.client.id) : null,
      paybox: Number(state.payboxId),
      organization: Number(state.organizationId),

      status: mode === "post",
      paid_rubles: total.toFixed(2),
      paid_lt: 0,
      comment: state.comment?.trim() || null,
    },
  ];
}