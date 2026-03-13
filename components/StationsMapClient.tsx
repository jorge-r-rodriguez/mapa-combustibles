"use client";

import { memo, useEffect } from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents
} from "react-leaflet";
import type { FuelType, StationFeatureCollection, StationListItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const userLocationIcon = L.icon({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const stationMarkerIcon = L.icon({
  iconUrl: "/icons/gas-station-marker.svg",
  shadowUrl: markerShadow.src,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -38],
  shadowSize: [41, 41],
  shadowAnchor: [12, 40]
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
  target
}: {
  target?: {
    lat: number;
    lon: number;
    zoom?: number;
  } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) {
      return;
    }

    map.flyTo([target.lat, target.lon], target.zoom ?? 11, {
      animate: true,
      duration: 1.2
    });
  }, [map, target]);

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

function getFuelLabel(fuel: FuelType) {
  return fuel === "gas95" ? "Gasolina 95" : "Diésel";
}

function PopupPricePill({
  label,
  value,
  tone,
  active
}: {
  label: string;
  value: number | null | undefined;
  tone: "primary" | "accent";
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl px-4 py-3 transition ${active
        ? tone === "primary"
          ? "bg-primary shadow-[0_6px_20px_rgba(11,99,246,0.28)]"
          : "bg-accent shadow-[0_6px_20px_rgba(27,182,106,0.28)]"
        : "bg-white/10 ring-1 ring-white/20"
        }`}
    >
      <p className={`text-[9px] font-semibold uppercase tracking-[0.18em] ${active ? "text-white/70" : "text-white/50"
        }`}>
        {label}
      </p>
      <p className={`mt-1 text-[17px] font-bold leading-none ${active ? "text-white" : "text-white/60"
        }`}>
        {value?.toFixed(3) ?? "--"}
        <span className={`ml-0.5 text-[11px] font-semibold ${active ? "text-white/80" : "text-white/40"
          }`}> €</span>
      </p>
    </div>
  );
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

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[700] sm:hidden">
      <div className="animate-slide-up pointer-events-auto overflow-hidden rounded-[24px] shadow-[0_20px_50px_rgba(15,23,42,0.22)]">
        {/* Dark header */}
        <div className="relative bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] px-4 pb-4 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-slate-400">
                {station.city} · {station.province}
              </p>
              <h3 className="mt-1 text-[17px] font-bold leading-tight text-white">{station.brand}</h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-400">{station.address}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ficha de estación"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <PopupPricePill label="Gasolina 95" value={station.priceGas95} tone="primary" active={fuel === "gas95"} />
            <PopupPricePill label="Diésel" value={station.priceDiesel} tone="accent" active={fuel === "diesel"} />
          </div>
        </div>

        {/* White body */}
        <div className="bg-white px-4 pb-4 pt-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span>Datos oficiales · {formatDate(station.updatedAt)}</span>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">ID {station.id}</span>
          </div>
          <a
            href={getDirectionsUrl(station, userLocation)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0b63f6,#1a7df8)] px-4 text-sm font-semibold !text-white no-underline shadow-[0_8px_20px_rgba(11,99,246,0.3)] transition hover:brightness-105 hover:!text-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5Z" fill="white" />
            </svg>
            {userLocation ? "Ir ahora con Google Maps" : "Abrir en Google Maps"}
          </a>
        </div>
      </div>
    </div>
  );
}

function StationsMapClientComponent({
  stations,
  fuel,
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
  onBoundsChange?: (bounds: Bounds) => void;
  onStationSelect?: (station: StationListItem | null) => void;
  selectedStation?: StationListItem | null;
  focusTarget?: { lat: number; lon: number; zoom?: number } | null;
  userLocation?: { lat: number; lon: number } | null;
  center: [number, number];
  zoom?: number;
}) {
  return (
    <div className="relative h-[520px] w-full sm:h-[620px] lg:h-[840px]">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        preferCanvas
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsReporter onBoundsChange={onBoundsChange} />
        <FocusMap target={focusTarget} />

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

            return (
              <Marker
                key={station.id}
                position={[station.lat, station.lon]}
                icon={stationMarkerIcon}
                eventHandlers={
                  {
                    click: () => onStationSelect?.(station),
                    touchstart: () => onStationSelect?.(station)
                  } as L.LeafletEventHandlerFnMap
                }
              >
                <Popup
                  minWidth={0}
                  closeButton={false}
                  autoPan
                  keepInView
                  offset={[0, -12]}
                  autoPanPaddingTopLeft={[24, 96]}
                  autoPanPaddingBottomRight={[24, 24]}
                  className="[&_.leaflet-popup-content]:m-0"
                >
                  {/* ── Premium popup card ───────────────── */}
                  <div className="w-[300px] overflow-hidden rounded-[24px] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">

                    {/* Dark gradient header */}
                    <div className="relative bg-[linear-gradient(145deg,#0f172a_0%,#1a2744_60%,#0f2847_100%)] px-4 pb-4 pt-4">
                      {/* Location + brand */}
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5Z" fill="rgba(255,255,255,0.7)" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-slate-400">
                            {station.city}{station.postalCode ? ` · ${station.postalCode}` : ""} — {station.province}
                          </p>
                          <h3 className="mt-0.5 text-[18px] font-bold leading-tight tracking-tight text-white">
                            {station.brand}
                          </h3>
                          <p className="mt-0.5 text-[12px] leading-5 text-slate-400">{station.address}</p>
                        </div>
                      </div>

                      {/* Price pills inside header */}
                      <div className="mt-3.5 grid grid-cols-2 gap-2">
                        <PopupPricePill label="Gasolina 95" value={station.priceGas95} tone="primary" active={fuel === "gas95"} />
                        <PopupPricePill label="Diésel" value={station.priceDiesel} tone="accent" active={fuel === "diesel"} />
                      </div>
                    </div>

                    {/* White body */}
                    <div className="bg-white px-4 pb-4 pt-3 space-y-3">
                      {/* Update status */}
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="#13854d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Dato oficial</p>
                            <p className="text-[12px] font-medium text-slate-700">{formatDate(station.updatedAt)}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent-dark">✓ Oficial</span>
                      </div>

                      {/* CTA button */}
                      <a
                        href={getDirectionsUrl(station, userLocation)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#0b63f6_0%,#1a7df8_100%)] px-4 text-sm font-semibold !text-white no-underline shadow-[0_8px_24px_rgba(11,99,246,0.32)] transition hover:brightness-105 hover:shadow-[0_10px_28px_rgba(11,99,246,0.4)] hover:!text-white"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5Z" fill="white" />
                        </svg>
                        {userLocation ? "Ir ahora con Google Maps" : "Abrir en Google Maps"}
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

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
