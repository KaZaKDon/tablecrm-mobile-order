import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { WalletCards } from "lucide-react";

type SelectOption = { value: string; label: string };

export function SaleParamsSection({ organizationId, payboxId, warehouseId, priceTypeId, organizationOptions, payboxOptions, warehouseOptions, priceTypeOptions, onOrganizationChange, onPayboxChange, onWarehouseChange, onPriceTypeChange }: {
  organizationId: number | null;
  payboxId: number | null;
  warehouseId: number | null;
  priceTypeId: number | null;
  organizationOptions: SelectOption[];
  payboxOptions: SelectOption[];
  warehouseOptions: SelectOption[];
  priceTypeOptions: SelectOption[];
  onOrganizationChange: (value: string) => void;
  onPayboxChange: (value: string) => void;
  onWarehouseChange: (value: string) => void;
  onPriceTypeChange: (value: string) => void;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-2 text-primary"><WalletCards className="h-5 w-5" /></div>
        <div>
          <CardTitle>3. Параметры продажи</CardTitle>
          <CardDescription>Счёт, организация, склад и тип цены</CardDescription>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Select value={organizationId ? String(organizationId) : ""} onChange={onOrganizationChange} options={organizationOptions} placeholder="Выберите организацию" />
        <Select value={payboxId ? String(payboxId) : ""} onChange={onPayboxChange} options={payboxOptions} placeholder="Выберите счёт" />
        <Select value={warehouseId ? String(warehouseId) : ""} onChange={onWarehouseChange} options={warehouseOptions} placeholder="Выберите склад" />
        <Select value={priceTypeId ? String(priceTypeId) : ""} onChange={onPriceTypeChange} options={priceTypeOptions} placeholder="Выберите тип цены" />
      </div>
    </Card>
  );
}
