import type { FuelType } from "@/lib/types";
import { cn, formatCompactPrice } from "@/lib/utils";

const labelMap: Record<FuelType, string> = {
  gas95: "Gasolina 95",
  diesel: "Diésel"
};

export function PriceBadge({
  fuel,
  price,
  compact = false
}: {
  fuel: FuelType;
  price: number | null | undefined;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-2",
        fuel === "gas95"
          ? "border-primary/10 bg-primary/5 text-primary"
          : "border-accent/10 bg-accent/5 text-accent-dark",
        compact && "px-2.5 py-1.5 text-sm"
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{labelMap[fuel]}</p>
      <p className={cn("mt-1 font-semibold", compact ? "text-sm" : "text-base")}>
        {formatCompactPrice(price)}
      </p>
    </div>
  );
}
