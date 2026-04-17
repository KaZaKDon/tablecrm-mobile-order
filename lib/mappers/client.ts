import type { ClientOption } from "@/types/tablecrm";

export function mapClient(row: any): ClientOption {
  return {
    id: Number(row.id),
    name: row.name ?? row.contragent_name ?? row.title ?? "Без имени",
    phone: row.phone ?? null,
    loyalityCardId: row.loyality_card_id ?? null,
    raw: row,
  };
}
