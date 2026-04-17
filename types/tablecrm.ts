export type Id = number;

export interface SelectOption {
  id: Id;
  name: string;
  raw?: unknown;
}

export interface ClientOption {
  id: Id;
  name: string;
  phone?: string | null;
  loyalityCardId?: number | null;
  raw?: unknown;
}

export interface ProductItem {
  id: Id; // nomenclature id
  name: string;
  price: number;
  quantity: number;

  unitId?: number | null;
  unitName?: string | null;

  priceTypeId?: number | null;
  tax?: number | null;
  discount?: number | null;
  sumDiscounted?: number | null;
  status?: string | null;

  article?: string;
  raw?: unknown;
}

export interface RepeatabilitySettings {
  repeatability_period: "minutes" | "hours" | "days" | "weeks" | "months";
  repeatability_value: string;
  repeatability_count: string;
  date_next_created: number;
}

export interface MetaOption {
  id: number | string;
  name: string;
  code?: string;
  phone?: string;
  raw?: unknown;
}

export interface MetaPayload {
  organizations: MetaOption[];
  payboxes: MetaOption[];
  warehouses: MetaOption[];
  priceTypes: MetaOption[];
  errors?: Record<string, string | null>;
}

export interface OrderFormState {
  token: string;
  phone: string;

  client: ClientOption | null;

  payboxId: number | null;
  organizationId: number | null;
  warehouseId: number | null;
  priceTypeId: number | null;

  comment: string;
  items: ProductItem[];

  repeatability?: RepeatabilitySettings | null;
}