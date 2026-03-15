import { env } from "./env";
import { getBoundingBoxFromPoints, pointToRouteDistanceKm } from "./geo";
import { prisma } from "./prisma";
import type { FuelType, RouteGeometryPoint, RouteOptimizationResult, StationWithRouteMeta } from "./types";
import { ensureStationsFresh } from "../services/station-ingest";

type ResolvedLocation = {
  label: string;
  lat: number;
  lon: number;
};

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: Array<[number, number]>;
    };
  }>;
};

async function resolveLocation(input: string): Promise<ResolvedLocation | null> {
  const query = input.trim();

  if (query.length < 2) {
    return null;
  }

  await ensureStationsFresh();

  const station = await prisma.station.findFirst({
    where: {
      OR: [
        {
          city: {
            contains: query
          }
        },
        {
          postalCode: {
            contains: query
          }
        }
      ]
    },
    orderBy: [{ city: "asc" }, { priceGas95: "asc" }]
  });

  if (!station) {
    return null;
  }

  const cityStations = await prisma.station.findMany({
    where: {
      city: station.city
    },
    select: {
      lat: true,
      lon: true
    }
  });

  const lat =
    cityStations.reduce((sum, current) => sum + current.lat, 0) / Math.max(cityStations.length, 1);
  const lon =
    cityStations.reduce((sum, current) => sum + current.lon, 0) / Math.max(cityStations.length, 1);

  return {
    label: `${station.city}, ${station.province}`,
    lat,
    lon
  };
}

async function fetchRouteGeometry(origin: ResolvedLocation, destination: ResolvedLocation) {
  const response = await fetch(
    `${env.OSRM_API_URL}/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`,
    {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(`No se pudo calcular la ruta (${response.status}).`);
  }

  const payload = (await response.json()) as OsrmRouteResponse;
  const route = payload.routes?.[0];

  if (!route) {
    throw new Error("No se pudo resolver una ruta válida.");
  }

  const geometry = route.geometry.coordinates.map(
    ([lon, lat]) => [lat, lon] as RouteGeometryPoint
  );

  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry
  };
}

export async function optimizeRouteRefuel(input: {
  origin: string;
  destination: string;
  fuel: FuelType;
  corridorKm?: number;
}) {
  const [origin, destination] = await Promise.all([
    resolveLocation(input.origin),
    resolveLocation(input.destination)
  ]);

  if (!origin || !destination) {
    return null;
  }

  const route = await fetchRouteGeometry(origin, destination);
  const corridorKm = input.corridorKm ?? 8;
  const bounds = getBoundingBoxFromPoints(route.geometry, corridorKm);
  const priceField = input.fuel === "diesel" ? "priceDiesel" : "priceGas95";

  const stations = await prisma.station.findMany({
    where: {
      lat: {
        gte: bounds.minLat,
        lte: bounds.maxLat
      },
      lon: {
        gte: bounds.minLon,
        lte: bounds.maxLon
      },
      [priceField]: {
        not: null
      }
    },
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
    },
    take: 2500
  });

  const prices = stations
    .map((station) => station[priceField])
    .filter((value): value is number => value != null);
  const averagePrice =
    prices.length > 0 ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null;

  const candidates: StationWithRouteMeta[] = stations
    .map((station) => {
      const distanceToRouteKm = pointToRouteDistanceKm(
        { lat: station.lat, lon: station.lon },
        route.geometry
      );
      const activePrice = station[priceField];

      return {
        ...station,
        updatedAt: station.updatedAt.toISOString(),
        distanceToRouteKm,
        savingsVsAverage:
          averagePrice != null && activePrice != null ? averagePrice - activePrice : null
      };
    })
    .filter((station) => station.distanceToRouteKm != null && station.distanceToRouteKm <= corridorKm)
    .sort((a, b) => {
      const aPrice = a[priceField] ?? Number.POSITIVE_INFINITY;
      const bPrice = b[priceField] ?? Number.POSITIVE_INFINITY;

      if (aPrice !== bPrice) {
        return aPrice - bPrice;
      }

      return (a.distanceToRouteKm ?? Number.POSITIVE_INFINITY) -
        (b.distanceToRouteKm ?? Number.POSITIVE_INFINITY);
    })
    .slice(0, 18);

  const result: RouteOptimizationResult = {
    originLabel: origin.label,
    destinationLabel: destination.label,
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    geometry: route.geometry,
    bounds,
    stations: candidates,
    bestStation: candidates[0] ?? null
  };

  return result;
}
