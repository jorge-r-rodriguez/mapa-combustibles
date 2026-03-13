import { prisma } from "./prisma";
import { getBoundingBoxFromRadius, haversineDistanceKm } from "./geo";
import type {
  FuelType,
  HomepageInsights,
  StationFeatureCollection,
  StationListItem,
  StationsQuery
} from "./types";
import { slugify } from "./utils";
import { ensureStationsFresh } from "../services/station-ingest";

function mapStation(station: {
  id: string;
  brand: string;
  address: string;
  city: string;
  province: string;
  postalCode: string | null;
  lat: number;
  lon: number;
  priceGas95: number | null;
  priceDiesel: number | null;
  updatedAt: Date;
}): StationListItem {
  return {
    ...station,
    updatedAt: station.updatedAt.toISOString()
  };
}

function getPriceField(fuel: FuelType) {
  return fuel === "diesel" ? "priceDiesel" : "priceGas95";
}

export async function getFilterOptions() {
  await ensureStationsFresh();
  const stations = await prisma.station.findMany({
    select: {
      brand: true,
      province: true
    }
  });

  const provinces = Array.from(new Set(stations.map((station) => station.province))).sort(
    (a, b) => a.localeCompare(b, "es")
  );
  const brands = Array.from(new Set(stations.map((station) => station.brand)))
    .sort((a, b) => a.localeCompare(b, "es"))
    .slice(0, 80);

  return {
    provinces,
    brands
  };
}

export async function getHomepageInsights(): Promise<HomepageInsights> {
  await ensureStationsFresh();
  const stations = await prisma.station.findMany({
    select: {
      city: true,
      province: true,
      priceGas95: true,
      priceDiesel: true,
      updatedAt: true
    }
  });

  const totalStations = stations.length;
  const gasValues = stations
    .map((station) => station.priceGas95)
    .filter((value): value is number => value != null);
  const dieselValues = stations
    .map((station) => station.priceDiesel)
    .filter((value): value is number => value != null);

  const cityMap = new Map<
    string,
    {
      city: string;
      province: string;
      gasValues: number[];
      dieselValues: number[];
      stationCount: number;
    }
  >();

  for (const station of stations) {
    const key = `${station.city}__${station.province}`;
    const entry = cityMap.get(key) ?? {
      city: station.city,
      province: station.province,
      gasValues: [],
      dieselValues: [],
      stationCount: 0
    };

    if (station.priceGas95 != null) {
      entry.gasValues.push(station.priceGas95);
    }

    if (station.priceDiesel != null) {
      entry.dieselValues.push(station.priceDiesel);
    }

    entry.stationCount += 1;
    cityMap.set(key, entry);
  }

  const cities = Array.from(cityMap.values());
  const cheapestCitiesGas95 = cities
    .filter((city) => city.gasValues.length >= 3)
    .map((city) => ({
      city: city.city,
      province: city.province,
      slug: slugify(city.city),
      avgPrice: city.gasValues.reduce((sum, value) => sum + value, 0) / city.gasValues.length,
      stationCount: city.stationCount
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice)
    .slice(0, 8);

  const cheapestCitiesDiesel = cities
    .filter((city) => city.dieselValues.length >= 3)
    .map((city) => ({
      city: city.city,
      province: city.province,
      slug: slugify(city.city),
      avgPrice:
        city.dieselValues.reduce((sum, value) => sum + value, 0) / city.dieselValues.length,
      stationCount: city.stationCount
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice)
    .slice(0, 8);

  const latestDate = stations[0]?.updatedAt ?? null;

  return {
    totalStations,
    avgGas95: gasValues.length
      ? gasValues.reduce((sum, value) => sum + value, 0) / gasValues.length
      : null,
    avgDiesel: dieselValues.length
      ? dieselValues.reduce((sum, value) => sum + value, 0) / dieselValues.length
      : null,
    updatedAt: latestDate ? latestDate.toISOString() : null,
    cheapestCitiesGas95,
    cheapestCitiesDiesel
  };
}

export async function getStationsGeoJSON(query: StationsQuery = {}) {
  await ensureStationsFresh();

  const fuelField = getPriceField(query.fuel ?? "gas95");
  const stations = await prisma.station.findMany({
    where: {
      province: query.province || undefined,
      city: query.city || undefined,
      postalCode: query.postalCode || undefined,
      brand: query.brand
        ? {
            contains: query.brand
          }
        : undefined,
      lat: query.bbox
        ? {
            gte: query.bbox.minLat,
            lte: query.bbox.maxLat
          }
        : undefined,
      lon: query.bbox
        ? {
            gte: query.bbox.minLon,
            lte: query.bbox.maxLon
          }
        : undefined,
      [fuelField]:
        query.minPrice != null || query.maxPrice != null
          ? {
              gte: query.minPrice,
              lte: query.maxPrice
            }
          : undefined
    },
    orderBy: [{ [fuelField]: "asc" }, { brand: "asc" }],
    take: query.take ?? 1500
  });

  const features = stations.map((station) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [station.lon, station.lat] as [number, number]
    },
    properties: mapStation(station)
  }));

  const collection: StationFeatureCollection = {
    type: "FeatureCollection",
    features
  };

  return collection;
}

export async function getStationsNear(input: {
  lat: number;
  lon: number;
  radius: number;
  fuel?: FuelType;
}) {
  await ensureStationsFresh();
  const bbox = getBoundingBoxFromRadius(input.lat, input.lon, input.radius);
  const fuelField = getPriceField(input.fuel ?? "gas95");

  const stations = await prisma.station.findMany({
    where: {
      lat: {
        gte: bbox.minLat,
        lte: bbox.maxLat
      },
      lon: {
        gte: bbox.minLon,
        lte: bbox.maxLon
      }
    }
  });

  return stations
    .map((station) => ({
      ...mapStation(station),
      distanceKm: haversineDistanceKm(input.lat, input.lon, station.lat, station.lon)
    }))
    .filter((station) => station.distanceKm <= input.radius)
    .sort((a, b) => {
      const aPrice = a[fuelField] ?? Number.POSITIVE_INFINITY;
      const bPrice = b[fuelField] ?? Number.POSITIVE_INFINITY;

      if (aPrice !== bPrice) {
        return aPrice - bPrice;
      }

      return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
    })
    .slice(0, 20);
}

export async function searchStations(query: string) {
  await ensureStationsFresh();
  const q = query.trim();

  if (q.length < 2) {
    return [];
  }

  const stations = await prisma.station.findMany({
    where: {
      OR: [
        {
          city: {
            contains: q
          }
        },
        {
          postalCode: {
            contains: q
          }
        }
      ]
    },
    orderBy: [{ city: "asc" }, { priceGas95: "asc" }],
    take: 20
  });

  const unique = new Map<string, StationListItem>();

  for (const station of stations) {
    const key = `${station.city}-${station.postalCode ?? ""}`;
    if (!unique.has(key)) {
      unique.set(key, mapStation(station));
    }
  }

  return Array.from(unique.values()).slice(0, 10);
}

export async function getCityPageData(citySlug: string) {
  await ensureStationsFresh();
  const stations = await prisma.station.findMany({
    select: {
      id: true,
      brand: true,
      address: true,
      city: true,
      province: true,
      postalCode: true,
      lat: true,
      lon: true,
      priceGas95: true,
      priceDiesel: true,
      updatedAt: true
    }
  });

  const filtered = stations.filter((station) => slugify(station.city) === citySlug);

  if (!filtered.length) {
    return null;
  }

  const gasValues = filtered
    .map((station) => station.priceGas95)
    .filter((value): value is number => value != null);
  const dieselValues = filtered
    .map((station) => station.priceDiesel)
    .filter((value): value is number => value != null);

  const center = {
    lat: filtered.reduce((sum, station) => sum + station.lat, 0) / filtered.length,
    lon: filtered.reduce((sum, station) => sum + station.lon, 0) / filtered.length
  };

  const geoJson: StationFeatureCollection = {
    type: "FeatureCollection",
    features: filtered.map((station) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [station.lon, station.lat]
      },
      properties: mapStation(station)
    }))
  };

  return {
    city: filtered[0].city,
    province: filtered[0].province,
    center,
    updatedAt: filtered[0].updatedAt.toISOString(),
    avgGas95: gasValues.length
      ? gasValues.reduce((sum, value) => sum + value, 0) / gasValues.length
      : null,
    avgDiesel: dieselValues.length
      ? dieselValues.reduce((sum, value) => sum + value, 0) / dieselValues.length
      : null,
    cheapest: filtered
      .map(mapStation)
      .sort((a, b) => (a.priceGas95 ?? Number.POSITIVE_INFINITY) - (b.priceGas95 ?? Number.POSITIVE_INFINITY))
      .slice(0, 12),
    chart: filtered
      .map(mapStation)
      .filter((station) => station.priceGas95 != null)
      .sort((a, b) => (a.priceGas95 ?? 0) - (b.priceGas95 ?? 0))
      .slice(0, 8),
    geoJson
  };
}

export async function getAvailableCitySlugs(limit = 24) {
  await ensureStationsFresh();
  const stations = await prisma.station.findMany({
    select: {
      city: true
    }
  });

  return Array.from(new Set(stations.map((station) => slugify(station.city)))).slice(0, limit);
}
