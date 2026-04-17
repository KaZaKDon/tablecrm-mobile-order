import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, WalletCards } from "lucide-react";

export function TokenSection({ token, connecting, onTokenChange, onConnect }: {
  token: string;
  connecting: boolean;
  onTokenChange: (value: string) => void;
  onConnect: () => void;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-2 text-primary"><WalletCards className="h-5 w-5" /></div>
        <div>
          <CardTitle>1. Подключение кассы</CardTitle>
          <CardDescription>Введите токен и загрузите справочники</CardDescription>
        </div>
      </div>
      <div className="space-y-3">
        <Input placeholder="Token" value={token} onChange={(e) => onTokenChange(e.target.value)} />
        <Button className="w-full" onClick={onConnect} disabled={connecting || !token.trim()}>
          {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Подключить
        </Button>
      </div>
    </Card>
  );
}
