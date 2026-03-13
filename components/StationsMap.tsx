"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import type { FuelType, StationFeatureCollection, StationListItem } from "@/lib/types";

const StationsMapClient = dynamic(
  () => import("./StationsMapClient").then((module) => module.StationsMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center bg-slate-100 text-sm text-slate-500">
        Cargando mapa interactivo...
      </div>
    )
  }
);

function StationsMapComponent(props: {
  stations: StationFeatureCollection;
  fuel: FuelType;
  onBoundsChange?: (bounds: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  }) => void;
  onStationSelect?: (station: StationListItem | null) => void;
  selectedStation?: StationListItem | null;
  focusTarget?: { lat: number; lon: number; zoom?: number } | null;
  userLocation?: { lat: number; lon: number } | null;
  center: [number, number];
  zoom?: number;
}) {
  return <StationsMapClient {...props} />;
}

export const StationsMap = memo(StationsMapComponent);
