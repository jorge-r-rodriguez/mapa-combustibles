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

function PopupPrice({
  label,
  value,
  tone
}: {
  label: string;
  value: number | null | undefined;
  tone: "primary" | "accent";
}) {
  return (
    <div
      className={`rounded-[18px] border px-3 py-2.5 ${
        tone === "primary"
          ? "border-primary/10 bg-primary/5"
          : "border-accent/10 bg-accent/5"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p
        className={`mt-1 text-[15px] font-semibold ${
          tone === "primary" ? "text-primary" : "text-accent-dark"
        }`}
      >
        {value?.toFixed(3) ?? "--"} €
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
      <div className="pointer-events-auto rounded-[24px] border border-white/80 bg-white/96 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              {station.city} · {station.province}
            </p>
            <h3 className="mt-1 text-base font-semibold leading-5 text-slate-950">{station.brand}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-600">{station.address}</p>
          </div>
          <div className="shrink-0 rounded-[18px] border border-primary/10 bg-primary/5 px-3 py-2 text-right">
            <p className="text-[9px] uppercase tracking-[0.18em] text-primary/70">{getFuelLabel(fuel)}</p>
            <p className="mt-1 text-base font-semibold text-primary">
              {activePrice?.toFixed(3) ?? "--"} €
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha de estación"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-700 shadow-sm transition hover:border-primary/20 hover:text-primary"
          >
            ×
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <PopupPrice label="Gasolina 95" value={station.priceGas95} tone="primary" />
          <PopupPrice label="Diésel" value={station.priceDiesel} tone="accent" />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">ID {station.id}</span>
          <span>Actualizado {formatDate(station.updatedAt)}</span>
        </div>

        <a
          href={getDirectionsUrl(station, userLocation)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0b63f6,#1a7df8)] px-4 text-sm font-semibold !text-white no-underline shadow-[0_10px_24px_rgba(11,99,246,0.24)] transition hover:brightness-95 hover:!text-white"
        >
          {userLocation ? "Ir ahora con Google Maps" : "Abrir en Maps"}
        </a>
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
                  autoPan
                  keepInView
                  offset={[0, -12]}
                  autoPanPaddingTopLeft={[24, 96]}
                  autoPanPaddingBottomRight={[24, 24]}
                  className="[&_.leaflet-popup-content]:m-0"
                >
                  <div className="w-[284px] overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)] ring-1 ring-primary/10">
                    <div className="bg-[linear-gradient(135deg,rgba(11,99,246,0.10),rgba(27,182,106,0.08))] px-4 pb-3 pt-3.5 pr-8">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                            {station.city} · {station.province}
                          </p>
                          <h3 className="mt-1.5 text-[17px] font-semibold leading-5 text-slate-950">
                            {station.brand}
                          </h3>
                          <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                            {station.address}
                          </p>
                          <p className="text-[13px] text-slate-500">
                            {station.postalCode ? `${station.postalCode} · ` : ""}
                            {station.city}
                          </p>
                        </div>
                        <div className="shrink-0 rounded-[18px] border border-primary/10 bg-white/88 px-2.5 py-1.5 text-right shadow-sm backdrop-blur">
                          <p className="text-[9px] uppercase tracking-[0.18em] text-primary/70">
                            {getFuelLabel(fuel)}
                          </p>
                          <p className="mt-0.5 text-[15px] font-semibold text-primary">
                            {activePrice?.toFixed(3) ?? "--"} €
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 px-4 py-3.5">
                      <div className="grid grid-cols-2 gap-2">
                        <PopupPrice label="Gasolina 95" value={station.priceGas95} tone="primary" />
                        <PopupPrice label="Diésel" value={station.priceDiesel} tone="accent" />
                      </div>

                      <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                              Estado del dato
                            </p>
                            <p className="mt-1 text-[13px] font-medium text-slate-800">
                              Actualizado {formatDate(station.updatedAt)}
                            </p>
                          </div>
                          <div className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent-dark">
                            Oficial
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">ID {station.id}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">Ruta en coche</span>
                      </div>

                      <a
                        href={getDirectionsUrl(station, userLocation)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0b63f6,#1a7df8)] px-4 text-sm font-semibold !text-white no-underline shadow-[0_10px_24px_rgba(11,99,246,0.24)] transition hover:brightness-95 hover:!text-white"
                      >
                        {userLocation ? "Ir ahora con Google Maps" : "Abrir en Maps"}
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
