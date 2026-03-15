import { prisma } from "./prisma";
import { cache } from "react";
import { getBoundingBoxFromRadius, haversineDistanceKm } from "./geo";
import type {
  FuelType,
  FuelIndexSummary,
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

const stationSelect = {
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
} as const;

const resolveCityNameBySlug = cache(async (citySlug: string) => {
  await ensureStationsFresh();

  const cities = await prisma.station.groupBy({
    by: ["city"],
    orderBy: {
      city: "asc"
    }
  });

  return cities.find((entry) => slugify(entry.city) === citySlug)?.city ?? null;
});

export const getFilterOptions = cache(async () => {
  await ensureStationsFresh();

  const [provinceGroups, brandGroups] = await Promise.all([
    prisma.station.groupBy({
      by: ["province"],
      orderBy: {
        province: "asc"
      }
    }),
    prisma.station.groupBy({
      by: ["brand"],
      orderBy: {
        brand: "asc"
      },
      take: 80
    })
  ]);

  return {
    provinces: provinceGroups.map((station) => station.province),
    brands: brandGroups.map((station) => station.brand)
  };
});

export const getHomepageInsights = cache(async (): Promise<HomepageInsights> => {
  await ensureStationsFresh();

  const [summary, cityGroups] = await Promise.all([
    prisma.station.aggregate({
      _count: {
        _all: true
      },
      _avg: {
        priceGas95: true,
        priceDiesel: true
      },
      _max: {
        updatedAt: true
      }
    }),
    prisma.station.groupBy({
      by: ["city", "province"],
      _avg: {
        priceGas95: true,
        priceDiesel: true
      },
      _count: {
        _all: true,
        priceGas95: true,
        priceDiesel: true
      }
    })
  ]);

  const cheapestCitiesGas95 = cityGroups
    .filter((city) => city._count.priceGas95 >= 3 && city._avg.priceGas95 != null)
    .map((city) => ({
      city: city.city,
      province: city.province,
      slug: slugify(city.city),
      avgPrice: city._avg.priceGas95 as number,
      stationCount: city._count._all
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice)
    .slice(0, 8);

  const cheapestCitiesDiesel = cityGroups
    .filter((city) => city._count.priceDiesel >= 3 && city._avg.priceDiesel != null)
    .map((city) => ({
      city: city.city,
      province: city.province,
      slug: slugify(city.city),
      avgPrice: city._avg.priceDiesel as number,
      stationCount: city._count._all
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice)
    .slice(0, 8);

  return {
    totalStations: summary._count._all,
    avgGas95: summary._avg.priceGas95,
    avgDiesel: summary._avg.priceDiesel,
    updatedAt: summary._max.updatedAt?.toISOString() ?? null,
    cheapestCitiesGas95,
    cheapestCitiesDiesel
  };
});

export const getFuelIndexSummary = cache(async (): Promise<FuelIndexSummary> => {
  await ensureStationsFresh();

  const [currentSummary, currentSnapshot, baselineSnapshot] = await Promise.all([
    prisma.station.aggregate({
      _count: {
        _all: true
      },
      _avg: {
        priceGas95: true,
        priceDiesel: true
      },
      _max: {
        updatedAt: true
      }
    }),
    prisma.fuelPriceSnapshot.findFirst({
      orderBy: {
        capturedAt: "desc"
      }
    }),
    prisma.fuelPriceSnapshot.findFirst({
      where: {
        capturedAt: {
          lte: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        capturedAt: "desc"
      }
    })
  ]);

  return {
    totalStations: currentSummary._count._all,
    avgGas95: currentSummary._avg.priceGas95,
    avgDiesel: currentSummary._avg.priceDiesel,
    weeklyDeltaGas95:
      currentSnapshot?.avgGas95 != null && baselineSnapshot?.avgGas95 != null
        ? currentSnapshot.avgGas95 - baselineSnapshot.avgGas95
        : null,
    weeklyDeltaDiesel:
      currentSnapshot?.avgDiesel != null && baselineSnapshot?.avgDiesel != null
        ? currentSnapshot.avgDiesel - baselineSnapshot.avgDiesel
        : null,
    updatedAt: currentSummary._max.updatedAt?.toISOString() ?? null
  };
});

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

export async function getNationalCheapestStations(input?: {
  fuel?: FuelType;
  province?: string;
  limit?: number;
}) {
  await ensureStationsFresh();

  const fuel = input?.fuel ?? "gas95";
  const priceField = getPriceField(fuel);
  const stations = await prisma.station.findMany({
    where: {
      province: input?.province || undefined,
      [priceField]: {
        not: null
      }
    },
    select: stationSelect,
    orderBy: [{ [priceField]: "asc" }, { city: "asc" }, { brand: "asc" }],
    take: input?.limit ?? 100
  });

  const items = stations.map(mapStation);

  return {
    fuel,
    stations: items,
    geoJson: {
      type: "FeatureCollection" as const,
      features: items.map((station) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [station.lon, station.lat] as [number, number]
        },
        properties: station
      }))
    }
  };
}

export const getCityPageData = cache(async (citySlug: string) => {
  const cityName = await resolveCityNameBySlug(citySlug);

  if (!cityName) {
    return null;
  }

  const filtered = await prisma.station.findMany({
    where: {
      city: cityName
    },
    select: stationSelect
  });

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
});

export const getAvailableCitySlugs = cache(async (limit = 24) => {
  await ensureStationsFresh();
  const cities = await prisma.station.groupBy({
    by: ["city"],
    orderBy: {
      city: "asc"
    }
  });

  return Array.from(new Set(cities.map((station) => slugify(station.city)))).slice(0, limit);
});
