import type { MetaPayload, MetaOption } from "@/types/tablecrm";

function toSelectOptions(items: MetaOption[]) {
  return items.map((item) => ({ value: String(item.id), label: item.name }));
}

export function getMetaOptions(meta: MetaPayload | null) {
  return {
    organizationOptions: toSelectOptions(meta?.organizations ?? []),
    payboxOptions: toSelectOptions(meta?.payboxes ?? []),
    warehouseOptions: toSelectOptions(meta?.warehouses ?? []),
    priceTypeOptions: toSelectOptions(meta?.priceTypes ?? []),
  };
}