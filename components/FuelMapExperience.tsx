"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  FuelType,
  HomepageInsights,
  MapViewMode,
  RouteOptimizationResult,
  StationFeatureCollection,
  StationListItem
} from "@/lib/types";
import { env } from "@/lib/env";
import { formatDate, formatNumber } from "@/lib/utils";
import { FilterPanel } from "@/components/FilterPanel";
import { HeatmapToggle } from "@/components/HeatmapToggle";
import { MapCard } from "@/components/MapCard";
import { RouteOptimizerPanel } from "@/components/RouteOptimizerPanel";
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
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="8" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
    </svg>
  );
}

function ViewModeToggle({
  viewMode,
  onChange
}: {
  viewMode: MapViewMode;
  onChange: (mode: MapViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-panel">
      {(["map", "list"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-pressed={viewMode === mode}
          className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            viewMode === mode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {mode === "map" ? "Mapa" : "Lista"}
        </button>
      ))}
    </div>
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
  const [viewMode, setViewMode] = useState<MapViewMode>("map");
  const [showHeatmap, setShowHeatmap] = useState(false);
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
  const [routeLoading, setRouteLoading] = useState(false);
  const [routePlan, setRoutePlan] = useState<RouteOptimizationResult | null>(null);
  const requestCache = useRef(new Map<string, StationFeatureCollection>());
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
    const bboxParam = [bounds.minLat, bounds.minLon, bounds.maxLat, bounds.maxLon].join(",");
    const params = new URLSearchParams({
      bbox: bboxParam,
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

    const requestKey = params.toString();

    const timeout = window.setTimeout(async () => {
      const cached = requestCache.current.get(requestKey);
      if (cached) {
        setCollection(cached);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/stations?${requestKey}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as { collection: StationFeatureCollection };
        if (!controller.signal.aborted && data.collection) {
          requestCache.current.set(requestKey, data.collection);
          setCollection(data.collection);
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
    }, 220);

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
          radius: "25",
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

  const visibleStations = useMemo(() => {
    const list = collection.features.map((feature) => feature.properties);
    return list
      .map((station) =>
        userLocation
          ? {
              ...station,
              distanceKm: Math.hypot(
                (station.lat - userLocation.lat) * 111,
                (station.lon - userLocation.lon) *
                  111 *
                  Math.cos((userLocation.lat * Math.PI) / 180)
              )
            }
          : station
      )
      .sort((a, b) => {
        const aPrice = filters.fuel === "gas95" ? a.priceGas95 : a.priceDiesel;
        const bPrice = filters.fuel === "gas95" ? b.priceGas95 : b.priceDiesel;
        return (aPrice ?? Number.POSITIVE_INFINITY) - (bPrice ?? Number.POSITIVE_INFINITY);
      });
  }, [collection.features, filters.fuel, userLocation]);

  const listStations = useMemo(() => {
    const source = nearbyStations.length ? nearbyStations : visibleStations;
    return [...source].sort((a, b) => {
      const aPrice = filters.fuel === "gas95" ? a.priceGas95 : a.priceDiesel;
      const bPrice = filters.fuel === "gas95" ? b.priceGas95 : b.priceDiesel;
      return (aPrice ?? Number.POSITIVE_INFINITY) - (bPrice ?? Number.POSITIVE_INFINITY);
    });
  }, [filters.fuel, nearbyStations, visibleStations]);

  const rankingStations = listStations
    .filter((station) => station.id !== selectedStation?.id)
    .slice(0, 20);
  const cheapestVisible = listStations[0];
  const activeStatus = useMemo(() => {
    if (locationLoading) {
      return {
        title: "Obteniendo tu ubicación",
        detail: "Estamos localizando tu posición y preparando estaciones cercanas."
      };
    }

    if (routeLoading) {
      return {
        title: "Calculando ruta",
        detail: "Buscando la mejor parada de repostaje entre origen y destino."
      };
    }

    if (loading) {
      return {
        title: "Actualizando mapa",
        detail: "Aplicando filtros y recargando estaciones del área visible."
      };
    }

    return null;
  }, [loading, locationLoading, routeLoading]);

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

  useEffect(() => {
    const autoLocate = window.localStorage.getItem("fuelmap:auto-locate");
    if (autoLocate === "1") {
      window.localStorage.removeItem("fuelmap:auto-locate");
      handleUseLocation();
    }
  }, []);

  function handleRouteReady(route: RouteOptimizationResult | null) {
    setRoutePlan(route);

    if (route?.bestStation) {
      setSelectedStation(route.bestStation);
      setFocusTarget({
        lat: route.bestStation.lat,
        lon: route.bestStation.lon,
        zoom: 10
      });
    }
  }

  return (
    <div id="explorar-mapa" className="space-y-5">
      {activeStatus ? (
        <div
          aria-live="polite"
          className="animate-slide-down rounded-[28px] border border-primary/12 bg-white/92 px-4 py-3 shadow-panel"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-primary" />
            <div>
              <p className="text-sm font-semibold text-ink">{activeStatus.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{activeStatus.detail}</p>
            </div>
          </div>
        </div>
      ) : null}

      <FilterPanel filters={filters} provinces={provinces} brands={brands} onChange={setFilters} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:items-center lg:flex-nowrap">
        <div className="w-full sm:flex-1 sm:min-w-[280px]">
          <SearchBox
            onSelect={(station) => {
              setFocusTarget({ lat: station.lat, lon: station.lon, zoom: 10 });
              setSelectedStation(station);
              setViewMode("map");
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={locationLoading}
          aria-busy={locationLoading}
          aria-label={locationLoading ? "Buscando tu ubicación..." : "Usar mi ubicación GPS"}
          className="flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-[1.4rem] bg-primary px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-dark disabled:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <GpsIcon spinning={locationLoading} />
          {locationLoading ? "Buscando..." : "Cerca de mí"}
        </button>
      </div>

      

      <MapCard
        title="Visualiza las gasolineras activas dentro del área visible"
        subtitle="Alterna entre mapa y lista, activa el mapa de calor y compara precios en tiempo real sobre datos oficiales."
        loading={loading}
        loadingLabel="Actualizando mapa y ranking..."
        actions={
          <>
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            <HeatmapToggle checked={showHeatmap} onChange={setShowHeatmap} />
          </>
        }
        aside={
          <div className="flex h-full min-h-0 flex-col">
            <div className="sticky top-0 z-10 border-b border-stroke bg-slate-50/95 px-5 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-600">
                    {loading ? "Actualizando estaciones..." : `${formatNumber(listStations.length)} estaciones visibles`}
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
                  Toca un marcador, usa el buscador o ejecuta una ruta para fijar una estación y compararla con el ranking.
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                {routePlan?.bestStation ? (
                  <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Mejor parada de la ruta
                    </p>
                    <div className="mt-3">
                      <StationCard station={routePlan.bestStation} fuel={filters.fuel} compact />
                    </div>
                  </div>
                ) : null}

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
        {viewMode === "map" ? (
          <StationsMap
            center={defaultCenter}
            zoom={env.NEXT_PUBLIC_DEFAULT_ZOOM}
            fuel={filters.fuel}
            stations={collection}
            showHeatmap={showHeatmap}
            routeGeometry={routePlan?.geometry}
            onBoundsChange={handleBoundsChange}
            onStationSelect={setSelectedStation}
            selectedStation={selectedStation}
            focusTarget={focusTarget}
            userLocation={userLocation}
          />
        ) : (
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2">
            {listStations.slice(0, 24).map((station) => (
              <StationCard key={`${station.id}-${station.updatedAt}`} station={station} fuel={filters.fuel} />
            ))}
            {!listStations.length ? (
              <div className="panel-muted col-span-full p-6 text-center text-sm text-slate-500">
                No hay estaciones en la vista actual.
              </div>
            ) : null}
          </div>
        )}
      </MapCard>

      <RouteOptimizerPanel
        fuel={filters.fuel}
        onRouteReady={handleRouteReady}
        onLoadingChange={setRouteLoading}
      />
    </div>
  );
}
