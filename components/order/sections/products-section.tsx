import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import type { ProductSearchItem } from "@/lib/mappers/product";
import { Loader2, PackageSearch } from "lucide-react";

export function ProductsSection({ token, productQuery, products, searching, onProductQueryChange, onSearch, onAdd }: {
  token: string;
  productQuery: string;
  products: ProductSearchItem[];
  searching: boolean;
  onProductQueryChange: (value: string) => void;
  onSearch: () => void;
  onAdd: (product: ProductSearchItem) => void;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-2 text-primary"><PackageSearch className="h-5 w-5" /></div>
        <div>
          <CardTitle>4. Товары</CardTitle>
          <CardDescription>Поиск и добавление номенклатуры</CardDescription>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Название или артикул" value={productQuery} onChange={(e) => onProductQueryChange(e.target.value)} />
          <Button variant="outline" onClick={onSearch} disabled={searching || !token.trim()}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Найти"}
          </Button>
        </div>
        <div className="space-y-2">
          {products.length ? products.map((product) => (
            <div key={String(product.id)} className="rounded-2xl border bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{[product.article, product.unit].filter(Boolean).join(" · ") || "Без доп. данных"}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatMoney(Number(product.price ?? 0))}</div>
                  <Button className="mt-2 h-9 px-3" onClick={() => onAdd(product)}>Добавить</Button>
                </div>
              </div>
            </div>
          )) : <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground">Товары не найдены</div>}
        </div>
      </div>
    </Card>
  );
}
