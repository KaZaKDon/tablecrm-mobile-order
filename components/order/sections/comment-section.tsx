import { Card, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function CommentSection({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Card>
      <CardTitle className="mb-2">Комментарий</CardTitle>
      <Textarea placeholder="Комментарий к продаже" value={value} onChange={(e) => onChange(e.target.value)} />
    </Card>
  );
}
