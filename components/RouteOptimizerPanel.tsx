"use client";

import { useState } from "react";
import type { FuelType, RouteOptimizationResult } from "@/lib/types";
import { StationCard } from "@/components/StationCard";
import { formatNumber } from "@/lib/utils";

export function RouteOptimizerPanel({
  fuel,
  onRouteReady,
  onLoadingChange
}: {
  fuel: FuelType;
  onRouteReady?: (route: RouteOptimizationResult | null) => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    onLoadingChange?.(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        origin,
        destination,
        fuel
      });
      const response = await fetch(`/api/route-optimizer?${params.toString()}`);
      const data = (await response.json()) as {
        result?: RouteOptimizationResult;
        error?: string;
      };

      if (!response.ok || !data.result) {
        throw new Error(data.error ?? "No se pudo calcular la ruta.");
      }

      setResult(data.result);
      onRouteReady?.(data.result);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo optimizar la ruta con los datos indicados.";
      setError(message);
      setResult(null);
      onRouteReady?.(null);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }

  return (
    <section className="panel p-5 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div>
          <p className="section-kicker">Ruta inteligente</p>
          <h2 className="section-title mt-3 text-3xl">Optimizar repostaje en ruta</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Introduce origen y destino como ciudad o código postal y localiza las estaciones más
            competitivas cerca del trayecto.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              placeholder="Origen: Madrid"
              className="control-input"
              required
            />
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Destino: Valencia"
              className="control-input"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? "Calculando mejor parada..." : "Buscar gasolineras en la ruta"}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="rounded-[30px] border border-stroke bg-slate-50/70 p-4 sm:p-5">
          {loading ? (
            <div
              aria-live="polite"
              className="flex min-h-[260px] flex-col justify-center rounded-[26px] border border-primary/15 bg-white px-6 py-8"
            >
              <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <div className="h-5 w-5 animate-spin-custom rounded-full border-2 border-slate-200 border-t-primary" />
                Calculando la mejor ruta y las estaciones más convenientes...
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="skeleton h-20 rounded-2xl" />
                <div className="skeleton h-20 rounded-2xl" />
                <div className="skeleton h-20 rounded-2xl" />
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="skeleton h-28 rounded-[26px]" />
                <div className="skeleton h-28 rounded-[26px]" />
              </div>
            </div>
          ) : result ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600">
                  {result.originLabel}
                </span>
                <span className="text-slate-300">→</span>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600">
                  {result.destinationLabel}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Ruta</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {formatNumber(result.distanceKm, 0)} km
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Tiempo</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {formatNumber(result.durationMin, 0)} min
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Paradas útiles</p>
                  <p className="mt-1 text-lg font-semibold text-ink">{result.stations.length}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {result.bestStation ? (
                  <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Mejor estación recomendada
                    </p>
                    <div className="mt-3">
                      <StationCard station={result.bestStation} fuel={fuel} compact />
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 lg:grid-cols-2">
                  {result.stations.slice(0, 6).map((station) => (
                    <StationCard key={station.id} station={station} fuel={fuel} compact />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-[26px] border border-dashed border-slate-200 bg-white px-6 text-center text-sm text-slate-500">
              La mejor estación de tu trayecto aparecerá aquí junto con el resumen de la ruta.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
