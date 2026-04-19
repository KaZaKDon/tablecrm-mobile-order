"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Loader2,
  PackageSearch,
  Search,
  ShoppingCart,
  Store,
  WalletCards,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mapProduct } from "@/lib/mappers/product";
import { formatMoney, maskPhone } from "@/lib/utils";
import type {
  ClientOption,
  MetaPayload,
  OrderFormState,
  ProductItem,
} from "@/types/tablecrm";

type ProductSearchItem = {
  id?: string | number;
  nomenclature?: string | number;
  nomenclature_id?: string | number;
  name?: string;
  nomenclature_name?: string;
  article?: string;
  code?: string;
  unit?: string | number | null;
  unit_id?: string | number | null;
  unit_name?: string | null;
  price?: number | string | null;
  price_type?: number | string | null;
  price_type_id?: number | string | null;
  tax?: number | string | null;
  discount?: number | string | null;
  sum_discounted?: number | string | null;
  status?: string | null;
  raw?: unknown;
};

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

function getRowSum(item: ProductItem) {
  const price = Number(item.price ?? 0);
  const quantity = Number(item.quantity ?? 0);
  const discount = Number(item.discount ?? 0);
  return price * quantity - discount;
}

function extractSaleMeta(payload: unknown, fallbackTotal: number) {
  const root = payload as any;

  const candidates = [
    root,
    root?.result,
    root?.data,
    root?.item,
    Array.isArray(root?.result) ? root.result[0] : null,
    Array.isArray(root?.data) ? root.data[0] : null,
    Array.isArray(root) ? root[0] : null,
  ].filter(Boolean);

  const first = candidates.find((item) => item && typeof item === "object") ?? null;

  const rawId =
    first?.id ??
    first?.doc_id ??
    first?.document_id ??
    first?.sale_id ??
    first?.idx ??
    null;

  const rawTotal =
    first?.sum ??
    first?.total ??
    first?.total_sum ??
    first?.paid_rubles ??
    first?.amount ??
    first?.price ??
    fallbackTotal;

  const parsedTotal = Number(rawTotal);

  return {
    id: rawId,
    total: Number.isFinite(parsedTotal) ? parsedTotal : fallbackTotal,
  };
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-md border bg-muted/40 p-2 text-muted-foreground">
        {icon}
      </div>
      <div className="space-y-1">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </div>
    </div>
  );
}

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
  const [saleInfo, setSaleInfo] = useState<{
    mode: "draft" | "post";
    id: string | number | null;
    total: number;
  } | null>(null);

  const total = useMemo(() => {
    return state.items.reduce((acc, item) => acc + getRowSum(item), 0);
  }, [state.items]);

  const filteredProducts = useMemo(() => {
    const term = productQuery.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) => {
      const name = String(product.name ?? product.nomenclature_name ?? "").toLowerCase();
      const article = String(product.article ?? product.code ?? "").toLowerCase();
      return name.includes(term) || article.includes(term);
    });
  }, [products, productQuery]);

  function resetStatus() {
    setError("");
    setMessage("");
  }

  function mapClient(row: any): ClientOption {
    return {
      id: Number(row.id),
      name: row.name ?? row.contragent_name ?? row.title ?? "Без имени",
      phone: row.phone ?? null,
      loyalityCardId: row.loyality_card_id ?? null,
      raw: row,
    };
  }

  async function loadProducts(search = "", options?: { silent?: boolean }) {
    if (!state.token.trim()) return;

    if (!options?.silent) {
      resetStatus();
      setSearchingProducts(true);
    }

    try {
      const response = await fetch("/api/tablecrm/nomenclature/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: state.token.trim(),
          search: search.trim(),
          priceTypeId: state.priceTypeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Не удалось загрузить товары");
      }

      setProducts(data.items ?? []);

      if (!options?.silent) {
        setMessage(
          data.items?.length ? `Товаров загружено: ${data.items.length}` : "Товары не найдены",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска товаров");
    } finally {
      if (!options?.silent) {
        setSearchingProducts(false);
      }
    }
  }

  async function connectToken() {
    resetStatus();
    setSaleInfo(null);
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

      setMessage(
        failed.length
          ? `Справочники загружены частично. Проблемы: ${failed.join(", ")}`
          : "Справочники успешно загружены.",
      );

      const firstOrganizationId = data.organizations?.[0]?.id
        ? Number(data.organizations[0].id)
        : null;
      const firstPayboxId = data.payboxes?.[0]?.id ? Number(data.payboxes[0].id) : null;
      const firstWarehouseId = data.warehouses?.[0]?.id
        ? Number(data.warehouses[0].id)
        : null;
      const firstPriceTypeId = data.priceTypes?.[0]?.id
        ? Number(data.priceTypes[0].id)
        : null;

      setState((prev) => ({
        ...prev,
        organizationId: prev.organizationId ?? firstOrganizationId,
        payboxId: prev.payboxId ?? firstPayboxId,
        warehouseId: prev.warehouseId ?? firstWarehouseId,
        priceTypeId: prev.priceTypeId ?? firstPriceTypeId,
      }));

      await loadProducts("", { silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка подключения");
    } finally {
      setConnecting(false);
    }
  }

  async function searchClient() {
    resetStatus();
    setSaleInfo(null);
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

      setMessage(
        data.first
          ? "Клиент найден."
          : "Клиент не найден. Можно создать продажу без карты лояльности.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска клиента");
    } finally {
      setSearchingClient(false);
    }
  }

  async function searchProducts() {
    setSaleInfo(null);
    await loadProducts(productQuery);
  }

  useEffect(() => {
    if (!meta || !state.token.trim()) return;
    void loadProducts(productQuery, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.priceTypeId]);

  function addProduct(productRow: ProductSearchItem) {
    setSaleInfo(null);

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
                }
              : item,
          ),
        };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            ...product,
            discount: Number(product.discount ?? 0),
            sumDiscounted: Number(product.sumDiscounted ?? 0),
          },
        ],
      };
    });
  }

  function updateItem(productId: number, patch: Partial<ProductItem>) {
    setSaleInfo(null);

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
          sumDiscounted: nextDiscount,
        };
      }),
    }));
  }

  function removeItem(productId: number) {
    setSaleInfo(null);

    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== productId),
    }));
  }

  async function submit(mode: "draft" | "post") {
    resetStatus();
    setSaleInfo(null);

    if (!state.token.trim()) {
      setError("Сначала введите токен.");
      return;
    }

    if (!state.items.length) {
      setError("Добавьте хотя бы один товар.");
      return;
    }

    if (!state.organizationId || !state.payboxId || !state.warehouseId) {
      setError("Заполните организацию, счёт и склад.");
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

      const saleMeta = extractSaleMeta(data?.result ?? data, total);

      setSaleInfo({
        mode,
        id: saleMeta.id,
        total: saleMeta.total,
      });

      setState((prev) => ({
        ...prev,
        items: [],
        comment: "",
        repeatability: null,
      }));
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
    <>
      {saleInfo ? (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] px-4">
          <div className="pointer-events-auto mx-auto w-full max-w-3xl rounded-lg border bg-background shadow-lg">
            <div className="flex items-start gap-3 p-4">
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {saleInfo.mode === "post"
                    ? "Продажа создана и проведена"
                    : "Продажа создана"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  ID: {saleInfo.id ?? "—"}, сумма: {formatMoney(saleInfo.total)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSaleInfo(null)}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Закрыть уведомление"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="min-h-screen bg-muted/30">
        <div className="mx-auto w-full max-w-3xl px-4 pb-40 pt-4 md:px-6">
          <div className="sticky top-0 z-30 mb-6 border-b bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
            <div className="flex flex-col gap-4 py-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  tablecrm.com
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Мобильный заказ</h1>
                <p className="text-sm text-muted-foreground">
                  Создание продажи и проведение в один клик.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={
                    meta
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-border bg-muted text-foreground"
                  }
                >
                  {meta ? "Касса подключена" : "Касса не подключена"}
                </Badge>

                <Badge className="border border-border bg-background text-foreground">
                  {state.items.length} поз.
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card className="rounded-lg border shadow-sm">
              <div className="p-5">
                <SectionHeader
                  icon={<Store className="h-4 w-4" />}
                  title="Подключение кассы"
                  description="Введите токен и загрузите справочники."
                />

                <div className="grid gap-3">
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

                  <Button
                    onClick={connectToken}
                    disabled={connecting || !state.token.trim()}
                    className="w-full md:w-auto"
                  >
                    {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Подключить
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="rounded-lg border shadow-sm">
              <div className="p-5">
                <SectionHeader
                  icon={<Search className="h-4 w-4" />}
                  title="Клиент"
                  description="Поиск клиента по телефону."
                />

                <div className="grid gap-3">
                  <div className="flex gap-2">
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
                      onClick={searchClient}
                      disabled={searchingClient || !state.token.trim()}
                    >
                      {searchingClient ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="rounded-lg border bg-background p-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Найденный клиент
                    </div>
                    <div className="text-sm font-medium">
                      {state.client?.name ?? "Клиент не выбран"}
                    </div>
                    {state.client?.phone ? (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {state.client.phone}
                      </div>
                    ) : null}
                    {state.client?.loyalityCardId ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Карта лояльности: {state.client.loyalityCardId}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-lg border shadow-sm">
              <div className="p-5">
                <SectionHeader
                  icon={<WalletCards className="h-4 w-4" />}
                  title="Параметры продажи"
                  description="Счёт, организация, склад и тип цены."
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
              </div>
            </Card>

            <Card className="rounded-lg border shadow-sm">
              <div className="p-5">
                <SectionHeader
                  icon={<PackageSearch className="h-4 w-4" />}
                  title="Товары"
                  description="Поиск и добавление номенклатуры по названию и артикулу."
                />

                <div className="grid gap-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Название или артикул"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={searchProducts}
                      disabled={searchingProducts || !state.token.trim()}
                    >
                      {searchingProducts ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Найти"
                      )}
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    {filteredProducts.length ? (
                      filteredProducts.map((product) => (
                        <div
                          key={String(
                            product.id ?? product.nomenclature ?? product.nomenclature_id,
                          )}
                          className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">
                                {product.name ?? product.nomenclature_name ?? "Без названия"}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {[
                                  product.article ?? product.code,
                                  product.unit_name ? `Ед.: ${product.unit_name}` : null,
                                  product.unit ? `Unit ID: ${product.unit}` : null,
                                  product.price_type ? `Тип цены: ${product.price_type}` : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") || "Без доп. данных"}
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <div className="text-sm font-semibold">
                                {formatMoney(Number(product.price ?? 0))}
                              </div>
                              <Button
                                onClick={() => addProduct(product)}
                                className="h-8 px-3 text-xs"
                              >
                                Добавить
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed bg-background p-6 text-sm text-muted-foreground">
                        Товары не найдены
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-lg border shadow-sm">
              <div className="p-5">
                <SectionHeader
                  icon={<ShoppingCart className="h-4 w-4" />}
                  title="Корзина"
                  description="Редактирование количества, цены, скидки и суммы по позициям."
                />

                <div className="grid gap-3">
                  {state.items.length ? (
                    state.items.map((item) => (
                      <div key={item.id} className="rounded-lg border bg-background p-4">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{item.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {[
                                item.article ? `Арт.: ${item.article}` : null,
                                item.unitName
                                  ? `Ед.: ${item.unitName}`
                                  : item.unitId
                                    ? `Ед. ID: ${item.unitId}`
                                    : null,
                                item.priceTypeId ? `Тип цены: ${item.priceTypeId}` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="secondary"
                            className="h-8 px-3 text-xs text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            Удалить
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
                              value={String(getRowSum(item).toFixed(2))}
                              readOnly
                              className="bg-muted/40"
                            />
                          </div>
                        </div>

                        <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                          {Number(item.price ?? 0) === 0 ? (
                            <span>
                              Цена по выбранному типу цены не найдена. Можно ввести вручную.
                            </span>
                          ) : (
                            <span>
                              {item.quantity} × {formatMoney(item.price)}
                              {Number(item.discount ?? 0) > 0
                                ? ` − скидка ${formatMoney(Number(item.discount ?? 0))}`
                                : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed bg-background p-6 text-sm text-muted-foreground">
                      Добавьте хотя бы один товар
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="rounded-lg border shadow-sm">
              <div className="p-5">
                <SectionHeader
                  icon={<WalletCards className="h-4 w-4" />}
                  title="Комментарий"
                  description="Дополнительный комментарий к продаже."
                />

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
              </div>
            </Card>

            {(message || error) && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  error
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : "border-border bg-background text-foreground"
                }`}
              >
                {error || message}
              </div>
            )}
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 md:px-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Итого
                </div>
                <div className="text-2xl font-semibold">{formatMoney(total)}</div>
              </div>
              <Badge className="border border-border bg-background text-foreground">
                {state.items.length} поз.
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => submit("draft")}
                disabled={!!submitting}
              >
                {submitting === "draft" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Создать продажу
              </Button>

              <Button onClick={() => submit("post")} disabled={!!submitting}>
                {submitting === "post" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Создать и провести
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}