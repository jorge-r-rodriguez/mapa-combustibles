"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet.heat";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents
} from "react-leaflet";
import { getPriceThresholds, getPriceToneFromThresholds, getPriceToneMeta } from "@/lib/pricing";
import type {
  FuelType,
  RouteGeometryPoint,
  StationFeatureCollection,
  StationListItem
} from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";
import { StationPriceBadge } from "@/components/StationPriceBadge";

const userLocationIcon = L.icon({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type Bounds = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

function BoundsReporter({ onBoundsChange }: { onBoundsChange?: (bounds: Bounds) => void }) {
  const map = useMapEvents({
    moveend() {
      if (!onBoundsChange) {
        return;
      }

      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        minLon: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLon: bounds.getEast()
      });
    },
    zoomend() {
      if (!onBoundsChange) {
        return;
      }

      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        minLon: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLon: bounds.getEast()
      });
    }
  });

  useEffect(() => {
    if (!onBoundsChange) {
      return;
    }

    const bounds = map.getBounds();
    onBoundsChange({
      minLat: bounds.getSouth(),
      minLon: bounds.getWest(),
      maxLat: bounds.getNorth(),
      maxLon: bounds.getEast()
    });
  }, [map, onBoundsChange]);

  return null;
}

function FocusMap({
  target,
  routeGeometry
}: {
  target?: { lat: number; lon: number; zoom?: number } | null;
  routeGeometry?: RouteGeometryPoint[];
}) {
  const map = useMap();
  const lastRouteKey = useRef<string | null>(null);

  useEffect(() => {
    if (!target) {
      return;
    }

    map.flyTo([target.lat, target.lon], target.zoom ?? 11, {
      animate: true,
      duration: 1.1
    });
  }, [map, target]);

  useEffect(() => {
    if (!routeGeometry?.length) {
      return;
    }

    const nextKey = `${routeGeometry[0]?.join(",")}-${routeGeometry[routeGeometry.length - 1]?.join(",")}`;
    if (lastRouteKey.current === nextKey) {
      return;
    }

    lastRouteKey.current = nextKey;
    map.fitBounds(routeGeometry.map(([lat, lon]) => [lat, lon] as [number, number]), {
      padding: [48, 48]
    });
  }, [map, routeGeometry]);

  return null;
}

function HeatLayer({
  points,
  enabled
}: {
  points: Array<[number, number, number]>;
  enabled: boolean;
}) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    const leafletHeat = L as typeof L & {
      heatLayer: (
        latlngs: Array<[number, number, number]>,
        options: Record<string, unknown>
      ) => L.Layer;
    };

    if (!enabled || !points.length || typeof leafletHeat.heatLayer !== "function") {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    layerRef.current = leafletHeat.heatLayer(points, {
      radius: 28,
      blur: 20,
      maxZoom: 12,
      minOpacity: 0.3,
      gradient: {
        0.2: "#22c55e",
        0.55: "#f59e0b",
        1: "#ef4444"
      }
    });

    layerRef.current.addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [enabled, map, points]);

  return null;
}

function getDirectionsUrl(
  station: StationListItem,
  userLocation?: { lat: number; lon: number } | null
) {
  const destination = `${station.lat},${station.lon}`;
  const origin = userLocation
    ? `&origin=${encodeURIComponent(`${userLocation.lat},${userLocation.lon}`)}`
    : "";

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${origin}&travelmode=driving`;
}

function createStationMarker(price: number | null | undefined, toneClass: string) {
  return L.divIcon({
    className: "fuel-marker-wrapper",
    html: `
      <div class="fuel-marker ${toneClass}">
        <span>${price != null ? `${price.toFixed(3)} €` : "--"}</span>
      </div>
    `,
    iconSize: [72, 38],
    iconAnchor: [36, 38],
    popupAnchor: [0, -32]
  });
}

function MobileStationPreview({
  station,
  fuel,
  userLocation,
  onClose
}: {
  station: StationListItem;
  fuel: FuelType;
  userLocation?: { lat: number; lon: number } | null;
  onClose?: () => void;
}) {
  const activePrice = fuel === "gas95" ? station.priceGas95 : station.priceDiesel;
  const tone = getPriceToneFromThresholds(activePrice, {
    cheapMax: activePrice ?? 0,
    expensiveMin: activePrice ?? 0
  });

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[700] sm:hidden">
      <div className="pointer-events-auto overflow-hidden rounded-[24px] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-3 border-b border-stroke bg-slate-900 px-4 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300">{station.city}</p>
            <h3 className="mt-1 text-base font-semibold text-white">{station.brand}</h3>
            <p className="mt-1 text-xs text-slate-300">{station.address}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Cerrar ficha de estación"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">
          <StationPriceBadge price={activePrice} tone={tone} label="Precio visible" />
          <a
            href={getDirectionsUrl(station, userLocation)}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-white"
          >
            Abrir ruta en Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

function StationsMapClientComponent({
  stations,
  fuel,
  showHeatmap = false,
  routeGeometry,
  onBoundsChange,
  onStationSelect,
  selectedStation,
  focusTarget,
  userLocation,
  center,
  zoom = 6
}: {
  stations: StationFeatureCollection;
  fuel: FuelType;
  showHeatmap?: boolean;
  routeGeometry?: RouteGeometryPoint[];
  onBoundsChange?: (bounds: Bounds) => void;
  onStationSelect?: (station: StationListItem | null) => void;
  selectedStation?: StationListItem | null;
  focusTarget?: { lat: number; lon: number; zoom?: number } | null;
  userLocation?: { lat: number; lon: number } | null;
  center: [number, number];
  zoom?: number;
}) {
  const activePrices = useMemo(
    () =>
      stations.features
        .map((feature) =>
          fuel === "gas95" ? feature.properties.priceGas95 : feature.properties.priceDiesel
        )
        .filter((value): value is number => value != null),
    [fuel, stations.features]
  );

  const thresholds = useMemo(() => getPriceThresholds(activePrices), [activePrices]);

  const heatPoints = useMemo(
    () =>
      stations.features.flatMap((feature) => {
        const price = fuel === "gas95" ? feature.properties.priceGas95 : feature.properties.priceDiesel;
        if (price == null) {
          return [];
        }

        const tone = getPriceToneFromThresholds(price, thresholds);
        const meta = getPriceToneMeta(tone);
        return [[feature.properties.lat, feature.properties.lon, meta.heatWeight] as [number, number, number]];
      }),
    [fuel, stations.features, thresholds]
  );

  return (
    <div className="relative h-[520px] w-full sm:h-[620px] lg:h-[840px]">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full" preferCanvas>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsReporter onBoundsChange={onBoundsChange} />
        <FocusMap target={focusTarget} routeGeometry={routeGeometry} />
        <HeatLayer points={heatPoints} enabled={showHeatmap} />

        {routeGeometry?.length ? (
          <Polyline
            positions={routeGeometry}
            pathOptions={{ color: "#0b63f6", weight: 5, opacity: 0.75, dashArray: "10 10" }}
          />
        ) : null}

        {userLocation ? (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lon]}
              radius={1500}
              pathOptions={{ color: "#0b63f6", fillColor: "#0b63f6", fillOpacity: 0.12 }}
            />
            <Marker position={[userLocation.lat, userLocation.lon]} icon={userLocationIcon}>
              <Popup>Tu ubicación</Popup>
            </Marker>
          </>
        ) : null}

        <MarkerClusterGroup chunkedLoading>
          {stations.features.map((feature) => {
            const station = feature.properties;
            const activePrice = fuel === "gas95" ? station.priceGas95 : station.priceDiesel;
            const tone = getPriceToneFromThresholds(activePrice, thresholds);
            const toneMeta = getPriceToneMeta(tone);
            const markerIcon = createStationMarker(activePrice, toneMeta.markerClass);

            return (
              <Marker
                key={`${station.id}-${fuel}`}
                position={[station.lat, station.lon]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => onStationSelect?.(station)
                }}
              >
                <Popup
                  minWidth={280}
                  autoPan
                  keepInView
                  offset={[0, -18]}
                  autoPanPaddingTopLeft={[24, 96]}
                  autoPanPaddingBottomRight={[24, 24]}
                  className="[&_.leaflet-popup-content]:m-0"
                >
                  <div className="w-[280px] overflow-hidden rounded-[22px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                    <div className="border-b border-stroke bg-slate-900 px-4 py-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300">
                        {station.city}
                        {station.postalCode ? ` · ${station.postalCode}` : ""}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-white">{station.brand}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-300">{station.address}</p>
                    </div>
                    <div className="space-y-3 px-4 py-4">
                      <div className="grid grid-cols-2 gap-2">
                        <StationPriceBadge
                          price={station.priceGas95}
                          tone={getPriceToneFromThresholds(station.priceGas95, thresholds)}
                          label="Gasolina 95"
                          compact
                        />
                        <StationPriceBadge
                          price={station.priceDiesel}
                          tone={getPriceToneFromThresholds(station.priceDiesel, thresholds)}
                          label="Diésel"
                          compact
                        />
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        Datos oficiales actualizados el {formatDate(station.updatedAt)}
                      </div>
                      <a
                        href={getDirectionsUrl(station, userLocation)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-white"
                      >
                        {userLocation ? "Navegar hasta esta estación" : "Abrir en Google Maps"}
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500] sm:hidden">
        <div className="pointer-events-auto rounded-2xl border border-white/70 bg-white/92 px-3 py-2 text-xs font-semibold text-slate-600 shadow-panel">
          {formatNumber(stations.features.length)} estaciones en pantalla
        </div>
      </div>

      {selectedStation ? (
        <MobileStationPreview
          station={selectedStation}
          fuel={fuel}
          userLocation={userLocation}
          onClose={() => onStationSelect?.(null)}
        />
      ) : null}
    </div>
  );
}

export const StationsMapClient = memo(StationsMapClientComponent);
