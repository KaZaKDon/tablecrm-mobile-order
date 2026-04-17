"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mapProduct } from "@/lib/mappers/product";
import { formatMoney, maskPhone } from "@/lib/utils";
import type { ClientOption, MetaPayload, OrderFormState, ProductItem } from "@/types/tablecrm";
import { Loader2, PackageSearch, Search, ShoppingCart, WalletCards } from "lucide-react";

const initialState: OrderFormState = {
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

type ProductSearchItem = {
  id: string | number;
  name: string;
  article?: string;
  unit?: string | number | null;
  unit_name?: string | null;
  price?: number | null;
  price_type?: number | null;
  tax?: number | null;
  discount?: number | null;
  sum_discounted?: number | null;
  status?: string | null;
  raw?: unknown;
};

export function OrderApp() {
  const [state, setState] = useState<OrderFormState>(initialState);
  const [meta, setMeta] = useState<MetaPayload | null>(null);
  const [products, setProducts] = useState<ProductSearchItem[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [submitting, setSubmitting] = useState<"draft" | "post" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const total = useMemo(() => {
    return state.items.reduce((acc, item) => {
      const rowSum =
        item.sumDiscounted != null
          ? Number(item.sumDiscounted)
          : item.price * item.quantity - Number(item.discount ?? 0);

      return acc + rowSum;
    }, 0);
  }, [state.items]);

  function mapClient(row: any): ClientOption {
    return {
      id: Number(row.id),
      name: row.name ?? row.contragent_name ?? row.title ?? "Без имени",
      phone: row.phone ?? null,
      loyalityCardId: row.loyality_card_id ?? null,
      raw: row,
    };
  }

  async function connectToken() {
    setError("");
    setMessage("");
    setConnecting(true);

    try {
      const response = await fetch("/api/tablecrm/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Не удалось загрузить справочники");
      }

      setMeta({
        organizations: data.organizations ?? [],
        payboxes: data.payboxes ?? [],
        warehouses: data.warehouses ?? [],
        priceTypes: data.priceTypes ?? [],
        errors: data.errors ?? {},
      });

      const failed = data?.errors
        ? Object.entries(data.errors)
            .filter(([, value]) => value)
            .map(([key]) => key)
        : [];

      if (failed.length) {
        setMessage(`Справочники загружены частично. Проблемы: ${failed.join(", ")}`);
      } else {
        setMessage("Справочники успешно загружены.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка подключения");
    } finally {
      setConnecting(false);
    }
  }

  async function searchClient() {
    setError("");
    setMessage("");
    setSearchingClient(true);

    try {
      const response = await fetch("/api/tablecrm/clients/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: state.token.trim(),
          phone: state.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Не удалось найти клиента");
      }

      setState((prev) => ({
        ...prev,
        client: data.first ? mapClient(data.first) : null,
      }));

      setMessage(data.first ? "Клиент найден." : "Клиент не найден. Можно создать продажу без карты лояльности.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска клиента");
    } finally {
      setSearchingClient(false);
    }
  }

  async function searchProducts() {
    setError("");
    setMessage("");
    setSearchingProducts(true);

    try {
      const response = await fetch("/api/tablecrm/nomenclature/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: state.token.trim(),
          search: productQuery.trim(),
          priceTypeId: state.priceTypeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Не удалось загрузить товары");
      }

      console.log("NOMENCLATURE RESPONSE", data);
      console.log("NOMENCLATURE ITEMS", data.items);

      setProducts(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска товаров");
    } finally {
      setSearchingProducts(false);
    }
  }

  function addProduct(productRow: ProductSearchItem) {
    const product = mapProduct(productRow, state.priceTypeId);

    setState((prev) => {
      const existing = prev.items.find((item) => item.id === product.id);

      if (existing) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  sumDiscounted: item.price * (item.quantity + 1) - Number(item.discount ?? 0),
                }
              : item,
          ),
        };
      }

      return {
        ...prev,
        items: [...prev.items, product],
      };
    });
  }

  function updateItem(productId: number, patch: Partial<ProductItem>) {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== productId) return item;

        const nextQuantity = Math.max(1, Number(patch.quantity ?? item.quantity) || 1);
        const nextPrice = Math.max(0, Number(patch.price ?? item.price) || 0);
        const nextDiscount = Math.max(0, Number(patch.discount ?? item.discount ?? 0) || 0);

        return {
          ...item,
          ...patch,
          quantity: nextQuantity,
          price: nextPrice,
          discount: nextDiscount,
          sumDiscounted: nextPrice * nextQuantity - nextDiscount,
        };
      }),
    }));
  }

  function removeItem(productId: number) {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== productId),
    }));
  }

  async function submit(mode: "draft" | "post") {
    setError("");
    setMessage("");

    if (!state.token.trim()) {
      setError("Сначала введите токен.");
      return;
    }

    if (!state.items.length) {
      setError("Добавьте хотя бы один товар.");
      return;
    }

    if (!state.organizationId || !state.payboxId || !state.warehouseId || !state.priceTypeId) {
      setError("Заполните организацию, счёт, склад и тип цены.");
      return;
    }

    setSubmitting(mode);

    try {
      const response = await fetch("/api/tablecrm/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: state.token.trim(),
          state,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Не удалось создать продажу");
      }

      setMessage(mode === "post" ? "Продажа создана и проведена." : "Продажа создана.");
      console.log("docs_sales result", data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSubmitting(null);
    }
  }

  const organizationOptions = (meta?.organizations ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }));

  const payboxOptions = (meta?.payboxes ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }));

  const warehouseOptions = (meta?.warehouses ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }));

  const priceTypeOptions = (meta?.priceTypes ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6 pb-40">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">tablecrm.com</p>
          <h1 className="text-2xl font-bold tracking-tight">Мобильный заказ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            WebApp для создания продажи и проведения в один клик.
          </p>
        </div>
        <Badge>{meta ? "Касса подключена" : "Касса не подключена"}</Badge>
      </div>

      <div className="space-y-4">
        <Card>
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-2 text-primary">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>1. Подключение кассы</CardTitle>
              <CardDescription>Введите токен и загрузите справочники</CardDescription>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Token"
              value={state.token}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  token: e.target.value,
                }))
              }
            />
            <Button className="w-full" onClick={connectToken} disabled={connecting || !state.token.trim()}>
              {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Подключить
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-2 text-primary">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>2. Клиент</CardTitle>
              <CardDescription>Поиск клиента по телефону</CardDescription>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Телефон"
              value={state.phone}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  phone: maskPhone(e.target.value),
                }))
              }
            />

            <Button
              variant="outline"
              className="w-full"
              onClick={searchClient}
              disabled={searchingClient || !state.token.trim()}
            >
              {searchingClient ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Найти клиента
            </Button>

            <div className="rounded-2xl border bg-slate-50 p-3 text-sm">
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Найденный клиент
              </div>
              <div className="font-medium">{state.client?.name ?? "Клиент не выбран"}</div>
              {state.client?.phone ? (
                <div className="text-muted-foreground">{state.client.phone}</div>
              ) : null}
              {state.client?.loyalityCardId ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  Карта лояльности: {state.client.loyalityCardId}
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-2 text-primary">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>3. Параметры продажи</CardTitle>
              <CardDescription>Счёт, организация, склад и тип цены</CardDescription>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Select
              value={state.organizationId ? String(state.organizationId) : ""}
              onChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  organizationId: value ? Number(value) : null,
                }))
              }
              options={organizationOptions}
              placeholder="Выберите организацию"
            />

            <Select
              value={state.payboxId ? String(state.payboxId) : ""}
              onChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  payboxId: value ? Number(value) : null,
                }))
              }
              options={payboxOptions}
              placeholder="Выберите счёт"
            />

            <Select
              value={state.warehouseId ? String(state.warehouseId) : ""}
              onChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  warehouseId: value ? Number(value) : null,
                }))
              }
              options={warehouseOptions}
              placeholder="Выберите склад"
            />

            <Select
              value={state.priceTypeId ? String(state.priceTypeId) : ""}
              onChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  priceTypeId: value ? Number(value) : null,
                }))
              }
              options={priceTypeOptions}
              placeholder="Выберите тип цены"
            />
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-2 text-primary">
              <PackageSearch className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>4. Товары</CardTitle>
              <CardDescription>Поиск и добавление номенклатуры</CardDescription>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Название или артикул"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
              <Button variant="outline" onClick={searchProducts} disabled={searchingProducts || !state.token.trim()}>
                {searchingProducts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Найти"}
              </Button>
            </div>

            <div className="space-y-2">
              {products.length ? (
                products.map((product) => (
                  <div key={String(product.id)} className="rounded-2xl border bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {[
                            product.article,
                            product.unit_name ? `Ед.: ${product.unit_name}` : null,
                            product.unit ? `Unit ID: ${product.unit}` : null,
                            product.price_type ? `Тип цены: ${product.price_type}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Без доп. данных"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatMoney(Number(product.price ?? 0))}</div>
                        <Button className="mt-2 h-9 px-3" onClick={() => addProduct(product)}>
                          Добавить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground">
                  Товары не найдены
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-2 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Корзина</CardTitle>
              <CardDescription>Количество, цена, скидка и сумма по позициям</CardDescription>
            </div>
          </div>

          <div className="space-y-3">
            {state.items.length ? (
              state.items.map((item) => (
                <div key={item.id} className="rounded-2xl border bg-white p-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[
                          item.article ? `Арт.: ${item.article}` : null,
                          item.unitName ? `Ед.: ${item.unitName}` : item.unitId ? `Ед. ID: ${item.unitId}` : null,
                          item.priceTypeId ? `Тип цены: ${item.priceTypeId}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-sm font-medium text-red-600"
                      onClick={() => removeItem(item.id)}
                    >
                      Удалить
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Количество</div>
                      <Input
                        type="number"
                        step="1"
                        min="1"
                        value={String(item.quantity)}
                        onChange={(e) =>
                          updateItem(item.id, {
                            quantity: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Цена</div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={String(item.price)}
                        onChange={(e) =>
                          updateItem(item.id, {
                            price: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Скидка</div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={String(item.discount ?? 0)}
                        onChange={(e) =>
                          updateItem(item.id, {
                            discount: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Сумма</div>
                      <Input
                        value={String(
                          (
                            item.sumDiscounted ??
                            item.price * item.quantity - Number(item.discount ?? 0)
                          ).toFixed(2)
                        )}
                        readOnly
                        className="bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                    {item.price === 0 ? (
                      <span>Цена по выбранному типу цены не найдена. Можно ввести вручную.</span>
                    ) : (
                      <span>
                        {item.quantity} × {formatMoney(item.price)}
                        {Number(item.discount ?? 0) > 0 ? ` − скидка ${formatMoney(Number(item.discount ?? 0))}` : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground">
                Добавьте хотя бы один товар
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-2">Комментарий</CardTitle>
          <Textarea
            placeholder="Комментарий к продаже"
            value={state.comment}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                comment: e.target.value,
              }))
            }
          />
        </Card>

        {(message || error) && (
          <div
            className={`rounded-2xl border p-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t bg-white/95 px-4 py-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Итого</div>
            <div className="text-2xl font-bold">{formatMoney(total)}</div>
          </div>
          <Badge>{state.items.length} поз.</Badge>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={() => submit("draft")} disabled={!!submitting}>
            {submitting === "draft" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Создать продажу
          </Button>

          <Button onClick={() => submit("post")} disabled={!!submitting}>
            {submitting === "post" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Создать и провести
          </Button>
        </div>
      </div>
    </main>
  );
}