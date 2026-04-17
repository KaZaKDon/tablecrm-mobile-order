import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProductItem } from "@/types/tablecrm";
import { ShoppingCart } from "lucide-react";

export function CartSection({ items, onUpdateItem, onRemoveItem }: {
  items: ProductItem[];
  onUpdateItem: (productId: number, patch: Partial<ProductItem>) => void;
  onRemoveItem: (productId: number) => void;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-2 text-primary"><ShoppingCart className="h-5 w-5" /></div>
        <div>
          <CardTitle>Корзина</CardTitle>
          <CardDescription>Количество, цена и сумма по позициям</CardDescription>
        </div>
      </div>
      <div className="space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.id} className="rounded-2xl border bg-white p-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">{[item.priceTypeId ? `Тип цены: ${item.priceTypeId}` : null, item.unitId ? `Ед.: ${item.unitId}` : null].filter(Boolean).join(" · ")}</div>
              </div>
              <button type="button" className="text-sm font-medium text-red-600" onClick={() => onRemoveItem(item.id)}>Удалить</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" step="1" min="1" value={String(item.quantity)} onChange={(e) => onUpdateItem(item.id, { quantity: Number(e.target.value) })} />
              <Input type="number" step="0.01" min="0" value={String(item.price)} onChange={(e) => onUpdateItem(item.id, { price: Number(e.target.value) })} />
              <Input value={String((item.price * item.quantity).toFixed(2))} readOnly className="bg-slate-50" />
            </div>
          </div>
        )) : <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground">Добавьте хотя бы один товар</div>}
      </div>
    </Card>
  );
}
