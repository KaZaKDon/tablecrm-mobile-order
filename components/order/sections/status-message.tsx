export function StatusMessage({ message, error }: { message: string; error: string }) {
  if (!message && !error) return null;
  return <div className={`rounded-2xl border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || message}</div>;
}
