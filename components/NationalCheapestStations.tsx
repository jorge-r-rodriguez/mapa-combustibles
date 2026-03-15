"use client";

import { useMemo, useState } from "react";
import { StationsMap } from "@/components/StationsMap";
import type { FuelType, StationFeatureCollection, StationListItem } from "@/lib/types";

type SortKey = "price" | "city" | "brand";

export function NationalCheapestStations({
  initialFuel,
  gasStations,
  gasGeoJson,
  dieselStations,
  dieselGeoJson,
  provinces
}: {
  initialFuel: FuelType;
  gasStations: StationListItem[];
  gasGeoJson: StationFeatureCollection;
  dieselStations: StationListItem[];
  dieselGeoJson: StationFeatureCollection;
  provinces: string[];
}) {
  const [fuel, setFuel] = useState<FuelType>(initialFuel);
  const [province, setProvince] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("price");

  const sourceStations = fuel === "gas95" ? gasStations : dieselStations;
  const sourceGeoJson = fuel === "gas95" ? gasGeoJson : dieselGeoJson;

  const filteredStations = useMemo(() => {
    const next = sourceStations.filter((station) => !province || station.province === province);
    return next.sort((a, b) => {
      if (sortKey === "brand") {
        return a.brand.localeCompare(b.brand, "es");
      }

      if (sortKey === "city") {
        return a.city.localeCompare(b.city, "es");
      }

      const aPrice = fuel === "gas95" ? a.priceGas95 : a.priceDiesel;
      const bPrice = fuel === "gas95" ? b.priceGas95 : b.priceDiesel;
      return (aPrice ?? Number.POSITIVE_INFINITY) - (bPrice ?? Number.POSITIVE_INFINITY);
    });
  }, [fuel, province, sortKey, sourceStations]);

  const filteredGeoJson = useMemo<StationFeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: sourceGeoJson.features.filter(
        (feature) => !province || feature.properties.province === province
      )
    }),
    [province, sourceGeoJson.features]
  );

  return (
    <div className="space-y-6">
      <div className="panel p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[180px_240px_220px]">
          <select
            value={fuel}
            onChange={(event) => setFuel(event.target.value as FuelType)}
            className="control-input"
          >
            <option value="gas95">Gasolina 95</option>
            <option value="diesel">Diésel</option>
          </select>
          <select
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            className="control-input"
          >
            <option value="">Todas las provincias</option>
            {provinces.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="control-input"
          >
            <option value="price">Ordenar por precio</option>
            <option value="city">Ordenar por ciudad</option>
            <option value="brand">Ordenar por marca</option>
          </select>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <StationsMap
          center={[40.4168, -3.7038]}
          zoom={6}
          fuel={fuel}
          showHeatmap
          stations={filteredGeoJson}
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Marca</th>
                <th className="px-4 py-3 font-semibold">Ciudad</th>
                <th className="px-4 py-3 font-semibold">Dirección</th>
                <th className="px-4 py-3 font-semibold">Precio</th>
                <th className="px-4 py-3 font-semibold">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.slice(0, 80).map((station) => (
                <tr key={station.id} className="border-t border-stroke">
                  <td className="px-4 py-3 font-semibold text-ink">{station.brand}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {station.city}, {station.province}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{station.address}</td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {(fuel === "gas95" ? station.priceGas95 : station.priceDiesel)?.toFixed(3) ?? "--"} €/l
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(station.updatedAt).toLocaleString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
