import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function SubmitBar({ total, count, submitting, onSubmit }: {
  total: number;
  count: number;
  submitting: "draft" | "post" | null;
  onSubmit: (mode: "draft" | "post") => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t bg-white/95 px-4 py-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div><div className="text-sm text-muted-foreground">Итого</div><div className="text-2xl font-bold">{formatMoney(total)}</div></div>
        <Badge>{count} поз.</Badge>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={() => onSubmit("draft")} disabled={!!submitting}>{submitting === "draft" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Создать продажу</Button>
        <Button onClick={() => onSubmit("post")} disabled={!!submitting}>{submitting === "post" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Создать и провести</Button>
      </div>
    </div>
  );
}
