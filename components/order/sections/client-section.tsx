import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ClientOption } from "@/types/tablecrm";
import { Loader2, Search } from "lucide-react";

export function ClientSection({ phone, token, client, searching, onPhoneChange, onSearch }: {
  phone: string;
  token: string;
  client: ClientOption | null;
  searching: boolean;
  onPhoneChange: (value: string) => void;
  onSearch: () => void;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-2 text-primary"><Search className="h-5 w-5" /></div>
        <div>
          <CardTitle>2. Клиент</CardTitle>
          <CardDescription>Поиск клиента по телефону</CardDescription>
        </div>
      </div>
      <div className="space-y-3">
        <Input placeholder="Телефон" value={phone} onChange={(e) => onPhoneChange(e.target.value)} />
        <Button variant="outline" className="w-full" onClick={onSearch} disabled={searching || !token.trim()}>
          {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Найти клиента
        </Button>
        <div className="rounded-2xl border bg-slate-50 p-3 text-sm">
          <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Найденный клиент</div>
          <div className="font-medium">{client?.name ?? "Клиент не выбран"}</div>
          {client?.phone ? <div className="text-muted-foreground">{client.phone}</div> : null}
          {client?.loyalityCardId ? <div className="mt-1 text-xs text-muted-foreground">Карта лояльности: {client.loyalityCardId}</div> : null}
        </div>
      </div>
    </Card>
  );
}
