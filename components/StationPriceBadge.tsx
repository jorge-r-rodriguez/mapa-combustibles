import type { PriceTone } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getPriceToneMeta } from "@/lib/pricing";

export function StationPriceBadge({
  price,
  tone,
  label = "Precio",
  compact = false
}: {
  price: number | null | undefined;
  tone: PriceTone;
  label?: string;
  compact?: boolean;
}) {
  const meta = getPriceToneMeta(tone);

  return (
    <div
      className={cn(
        "rounded-2xl px-3 py-2 ring-1",
        meta.bgClass,
        meta.textClass,
        meta.ringClass,
        compact && "px-2.5 py-1.5"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
          {price != null ? `${price.toFixed(3)} €/l` : "--"}
        </p>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold">
          {meta.label}
        </span>
      </div>
    </div>
  );
}
