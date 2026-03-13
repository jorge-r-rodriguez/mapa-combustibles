"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  FuelType,
  HomepageInsights,
  StationFeatureCollection,
  StationListItem
} from "@/lib/types";
import { env } from "@/lib/env";
import { formatDate, formatNumber } from "@/lib/utils";
import { FilterPanel } from "@/components/FilterPanel";
import { MapCard } from "@/components/MapCard";
import { SearchBox } from "@/components/SearchBox";
import { StationCard } from "@/components/StationCard";
import { StationsMap } from "@/components/StationsMap";

const emptyCollection: StationFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

type Bounds = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

type FilterState = {
  fuel: FuelType;
  province: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
};

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function GpsIcon({ spinning }: { spinning: boolean }) {
  return spinning ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin-custom"
    >
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="8" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
    </svg>
  );
}

export function FuelMapExperience({
  provinces,
  brands,
  insights
}: {
  provinces: string[];
  brands: string[];
  insights: HomepageInsights;
}) {
  const [filters, setFilters] = useState<FilterState>({
    fuel: "gas95",
    province: "",
    brand: "",
    minPrice: "",
    maxPrice: ""
  });
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [collection, setCollection] = useState<StationFeatureCollection>(emptyCollection);
  const [loading, setLoading] = useState(false);
  const [nearbyStations, setNearbyStations] = useState<StationListItem[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationListItem | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lon: number; zoom?: number } | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const defaultCenter = useMemo(
    () => [env.NEXT_PUBLIC_DEFAULT_CENTER_LAT, env.NEXT_PUBLIC_DEFAULT_CENTER_LON] as [number, number],
    []
  );

  const handleBoundsChange = useCallback((nextBounds: Bounds) => {
    setBounds((currentBounds) => {
      if (!currentBounds) {
        return nextBounds;
      }

      const round = (value: number) => Number(value.toFixed(3));
      const hasChanged =
        round(currentBounds.minLat) !== round(nextBounds.minLat) ||
        round(currentBounds.minLon) !== round(nextBounds.minLon) ||
        round(currentBounds.maxLat) !== round(nextBounds.maxLat) ||
        round(currentBounds.maxLon) !== round(nextBounds.maxLon);

      return hasChanged ? nextBounds : currentBounds;
    });
  }, []);

  useEffect(() => {
    if (!bounds) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      minLat: String(bounds.minLat),
      minLon: String(bounds.minLon),
      maxLat: String(bounds.maxLat),
      maxLon: String(bounds.maxLon),
      fuel: filters.fuel
    });

    if (filters.province) {
      params.set("province", filters.province);
    }

    if (filters.brand) {
      params.set("brand", filters.brand);
    }

    if (filters.minPrice) {
      params.set("minPrice", filters.minPrice);
    }

    if (filters.maxPrice) {
      params.set("maxPrice", filters.maxPrice);
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/stations?${params.toString()}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as { collection: StationFeatureCollection };
        if (!controller.signal.aborted) {
          setCollection(data.collection ?? emptyCollection);
        }
      } catch (error) {
        if (!isAbortError(error)) {
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [bounds, filters]);

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const params = new URLSearchParams({
          lat: String(userLocation.lat),
          lon: String(userLocation.lon),
          radius: "20",
          fuel: filters.fuel
        });
        const response = await fetch(`/api/stations/near?${params.toString()}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as { stations: StationListItem[] };

        if (!controller.signal.aborted) {
          setNearbyStations(data.stations ?? []);
        }
      } catch (error) {
        if (!isAbortError(error)) {
          console.error(error);
        }
      }
    })();

    return () => controller.abort();
  }, [filters.fuel, userLocation]);

  const visibleStations = useMemo(
    () =>
      collection.features
        .map((feature) => feature.properties)
        .sort((a, b) => {
          const aPrice = filters.fuel === "gas95" ? a.priceGas95 : a.priceDiesel;
          const bPrice = filters.fuel === "gas95" ? b.priceGas95 : b.priceDiesel;
          return (aPrice ?? Number.POSITIVE_INFINITY) - (bPrice ?? Number.POSITIVE_INFINITY);
        }),
    [collection.features, filters.fuel]
  );

  const ranking = nearbyStations.length ? nearbyStations : visibleStations.slice(0, 24);
  const rankingStations = ranking.filter((station) => station.id !== selectedStation?.id).slice(0, 20);
  const cheapestVisible = visibleStations[0];

  function handleUseLocation() {
    if (!navigator.geolocation) {
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };

        setUserLocation(nextLocation);
        setFocusTarget({ ...nextLocation, zoom: 11 });
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000
      }
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px]">
        <SearchBox
          onSelect={(station) => {
            setFocusTarget({ lat: station.lat, lon: station.lon, zoom: 10 });
            setSelectedStation(station);
          }}
        />
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={locationLoading}
          aria-busy={locationLoading}
          aria-label={locationLoading ? "Buscando tu ubicación…" : "Usar mi ubicación GPS"}
          className="flex h-14 items-center justify-center gap-2.5 rounded-[1.4rem] bg-primary px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-dark disabled:opacity-80"
        >
          <GpsIcon spinning={locationLoading} />
          {locationLoading ? "Buscando…" : "Usar mi ubicación"}
        </button>
      </div>

      <FilterPanel filters={filters} provinces={provinces} brands={brands} onChange={setFilters} />

      <MapCard
        title="Visualiza las gasolineras activas dentro del área visible"
        subtitle="El mapa solo consulta estaciones dentro del área mostrada para reducir carga, acelerar la búsqueda y mantener el ranking realmente útil."
        loading={loading}
        aside={
          <div className="flex h-full min-h-0 flex-col">
            {/* Sticky aside header */}
            <div className="sticky top-0 z-10 border-b border-stroke bg-slate-50/95 px-5 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-600">
                    {loading
                      ? "Actualizando estaciones…"
                      : `${formatNumber(visibleStations.length)} estaciones visibles`}
                  </p>
                  <h3 className="section-title mt-2 text-xl">
                    {nearbyStations.length ? "Ranking cerca de ti" : "Ranking visible"}
                  </h3>
                </div>
                {cheapestVisible ? (
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2 text-right">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Mejor precio
                    </p>
                    <p className="mt-1 text-base font-semibold text-primary">
                      {(filters.fuel === "gas95"
                        ? cheapestVisible.priceGas95
                        : cheapestVisible.priceDiesel
                      )?.toFixed(3) ?? "--"}{" "}
                      €/l
                    </p>
                  </div>
                ) : null}
              </div>

              {insights.updatedAt ? (
                <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Fuente oficial actualizada el {formatDate(insights.updatedAt)}
                </p>
              ) : null}
            </div>

            {/* Selected station */}
            <div className="space-y-3 border-b border-stroke px-4 py-4">
              {selectedStation ? (
                <div className="rounded-3xl border border-accent/15 bg-accent/5 p-1">
                  <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-dark">
                    Estación seleccionada
                  </div>
                  <div className="pt-2">
                    <StationCard station={selectedStation} fuel={filters.fuel} compact />
                  </div>
                </div>
              ) : (
                <div className="panel-muted p-4 text-sm leading-6 text-slate-500">
                  Haz clic en un marcador o usa el buscador para fijar una estación y compararla con el ranking.
                </div>
              )}
            </div>

            {/* Ranking list */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                {rankingStations.map((station, index) => (
                  <div key={`${station.id}-${station.updatedAt}`} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        #{index + 1}
                      </p>
                      {station.distanceKm != null ? (
                        <p className="text-xs text-slate-400">{formatNumber(station.distanceKm, 1)} km</p>
                      ) : null}
                    </div>
                    <StationCard station={station} fuel={filters.fuel} compact />
                  </div>
                ))}
                {!rankingStations.length ? (
                  <div className="panel-muted p-6 text-center">
                    <p className="text-2xl">🔍</p>
                    <p className="mt-2 text-sm font-medium text-slate-600">Sin resultados</p>
                    <p className="mt-1 text-xs text-slate-400">
                      No hay estaciones para los filtros actuales.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        }
      >
        <StationsMap
          center={defaultCenter}
          zoom={env.NEXT_PUBLIC_DEFAULT_ZOOM}
          fuel={filters.fuel}
          stations={collection}
          onBoundsChange={handleBoundsChange}
          onStationSelect={setSelectedStation}
          selectedStation={selectedStation}
          focusTarget={focusTarget}
          userLocation={userLocation}
        />
      </MapCard>
    </div>
  );
}
