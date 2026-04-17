import type { MetaPayload, OptionItem } from "@/types/tablecrm";

function toSelectOptions(items: OptionItem[]) {
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
