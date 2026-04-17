import { Badge } from "@/components/ui/badge";

export function HeaderSection({ connected }: { connected: boolean }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-primary">tablecrm.com</p>
        <h1 className="text-2xl font-bold tracking-tight">Мобильный заказ</h1>
        <p className="mt-1 text-sm text-muted-foreground">WebApp для создания продажи и проведения в один клик.</p>
      </div>
      <Badge>{connected ? "Касса подключена" : "Касса не подключена"}</Badge>
    </div>
  );
}
