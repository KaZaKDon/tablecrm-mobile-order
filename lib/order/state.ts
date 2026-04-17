import type { OrderFormState } from "@/types/tablecrm";

export const initialOrderState: OrderFormState = {
  token: "",
  phone: "+7",
  client: null,
  organizationId: null,
  payboxId: null,
  warehouseId: null,
  priceTypeId: null,
  comment: "",
  items: [],
  repeatability: null,
};
