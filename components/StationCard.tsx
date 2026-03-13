import type { FuelType, StationListItem } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";
import { PriceBadge } from "@/components/PriceBadge";

export function StationCard({
  station,
  fuel,
  compact = false
}: {
  station: StationListItem;
  fuel: FuelType;
  compact?: boolean;
}) {
  return (
    <article className={`panel-muted ${compact ? "p-3.5" : "p-4"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{station.province}</p>
          <h3 className={`mt-1 font-semibold text-ink ${compact ? "text-[15px]" : "text-base"}`}>
            {station.brand}
          </h3>
          <p className={`mt-2 text-slate-600 ${compact ? "text-[13px] leading-5" : "text-sm"}`}>
            {station.address}
          </p>
          <p className={`text-slate-500 ${compact ? "text-[12px]" : "text-sm"}`}>
            {station.city}
            {station.postalCode ? ` · ${station.postalCode}` : ""}
          </p>
        </div>
        <PriceBadge
          fuel={fuel}
          price={fuel === "gas95" ? station.priceGas95 : station.priceDiesel}
          compact
        />
      </div>
      <div
        className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-500 ${
          compact ? "text-[12px]" : "text-sm"
        }`}
      >
        <span>Gasolina 95: {station.priceGas95?.toFixed(3) ?? "--"} €/l</span>
        <span>Diésel: {station.priceDiesel?.toFixed(3) ?? "--"} €/l</span>
        {station.distanceKm != null ? <span>{formatNumber(station.distanceKm, 1)} km</span> : null}
        <span>Actualizado {formatDate(station.updatedAt)}</span>
      </div>
    </article>
  );
}
