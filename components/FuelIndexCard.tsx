import { cn, formatDate, formatNumber } from "@/lib/utils";

export function FuelIndexCard({
  label,
  value,
  variation,
  updatedAt
}: {
  label: string;
  value: number | null;
  variation: number | null;
  updatedAt?: string | null;
}) {
  const positive = (variation ?? 0) > 0;

  return (
    <article className="panel p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight text-ink">
        {value != null ? `${value.toFixed(3)} €/l` : "--"}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            variation == null
              ? "bg-slate-100 text-slate-500"
              : positive
                ? "bg-rose-50 text-rose-700"
                : "bg-emerald-50 text-emerald-700"
          )}
        >
          {variation == null
            ? "Sin histórico suficiente"
            : `${positive ? "+" : ""}${formatNumber(variation, 3)} €/l vs. semana`}
        </span>
        {updatedAt ? (
          <span className="text-xs text-slate-400">Actualizado {formatDate(updatedAt)}</span>
        ) : null}
      </div>
    </article>
  );
}
