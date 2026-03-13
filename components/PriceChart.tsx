import type { StationListItem } from "@/lib/types";

export function PriceChart({ stations }: { stations: StationListItem[] }) {
  if (!stations.length) {
    return (
      <div className="panel-muted flex min-h-[320px] items-center justify-center p-6 text-sm text-slate-500">
        No hay datos suficientes para generar el gráfico.
      </div>
    );
  }

  const values = stations.map((station) => station.priceGas95 ?? 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 0.001);

  return (
    <div className="panel-muted overflow-hidden p-5 sm:p-6">
      <div className="flex min-h-[280px] items-end gap-3 overflow-x-auto pb-1">
        {stations.map((station) => {
          const value = station.priceGas95 ?? min;
          const height = 80 + ((value - min) / range) * 140;

          return (
            <div key={station.id} className="flex min-w-[88px] flex-col items-center gap-3">
              <div className="flex h-[230px] w-full items-end rounded-[26px] bg-slate-100 p-1">
                <div
                  className="w-full rounded-[22px] bg-gradient-to-t from-primary to-accent"
                  style={{ height }}
                />
              </div>
              <div className="text-center text-xs text-slate-600">
                <p className="font-semibold text-ink">{value.toFixed(3)} €</p>
                <p className="line-clamp-2">{station.brand}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
