import { prisma } from "../lib/prisma";
import { env } from "../lib/env";

const STATION_SYNC_KEY = "stations";
const STATION_SYNC_INTERVAL_MS = 60 * 60 * 1000;

type GovernmentStationRecord = {
  "C.P.": string;
  "Dirección": string;
  Latitud: string;
  Localidad: string;
  "Longitud (WGS84)": string;
  Municipio: string;
  "Precio Gasoleo A": string;
  "Precio Gasolina 95 E5": string;
  Provincia: string;
  "Rótulo": string;
  IDEESS: string;
};

type GovernmentResponse = {
  Fecha: string;
  ListaEESSPrecio: GovernmentStationRecord[];
};

function parseNumber(value: string) {
  if (!value) {
    return null;
  }

  const normalized = Number.parseFloat(value.replace(",", "."));

  return Number.isFinite(normalized) ? normalized : null;
}

function parseDate(value: string) {
  const [datePart, timePart] = value.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours = 0, minutes = 0, seconds = 0] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function normalizeStation(record: GovernmentStationRecord, updatedAt: Date) {
  const lat = parseNumber(record.Latitud);
  const lon = parseNumber(record["Longitud (WGS84)"]);

  if (lat == null || lon == null) {
    return null;
  }

  return {
    id: record.IDEESS,
    brand: record["Rótulo"]?.trim() || "Sin marca",
    address: record["Dirección"]?.trim() || "Dirección no disponible",
    city: record.Municipio?.trim() || record.Localidad?.trim() || "Sin ciudad",
    province: record.Provincia?.trim() || "Sin provincia",
    postalCode: record["C.P."]?.trim() || null,
    lat,
    lon,
    priceGas95: parseNumber(record["Precio Gasolina 95 E5"]),
    priceDiesel: parseNumber(record["Precio Gasoleo A"]),
    updatedAt
  };
}

async function fetchGovernmentStations() {
  const response = await fetch(env.GOV_FUEL_DATASET_URL, {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`No se pudo descargar el dataset oficial (${response.status}).`);
  }

  return (await response.json()) as GovernmentResponse;
}

async function capturePriceSnapshot(sourceUpdatedAt: Date) {
  const summary = await prisma.station.aggregate({
    _count: {
      _all: true
    },
    _avg: {
      priceGas95: true,
      priceDiesel: true
    }
  });

  if (!summary._count._all) {
    return;
  }

  const existing = await prisma.fuelPriceSnapshot.findFirst({
    where: {
      sourceUpdatedAt
    }
  });

  if (existing) {
    return;
  }

  await prisma.fuelPriceSnapshot.create({
    data: {
      avgGas95: summary._avg.priceGas95,
      avgDiesel: summary._avg.priceDiesel,
      totalStations: summary._count._all,
      sourceUpdatedAt
    }
  });
}

export async function syncStations() {
  const syncStartedAt = new Date();

  try {
    const payload = await fetchGovernmentStations();
    const updatedAt = parseDate(payload.Fecha);
    const stations = payload.ListaEESSPrecio.map((record) =>
      normalizeStation(record, updatedAt)
    ).filter((record): record is NonNullable<typeof record> => record !== null);
    const syncFinishedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.station.deleteMany();
      await tx.station.createMany({
        data: stations
      });
      await tx.syncState.upsert({
        where: {
          key: STATION_SYNC_KEY
        },
        update: {
          lastAttemptAt: syncStartedAt,
          lastSuccessAt: syncFinishedAt,
          sourceUpdatedAt: updatedAt,
          status: "success"
        },
        create: {
          key: STATION_SYNC_KEY,
          lastAttemptAt: syncStartedAt,
          lastSuccessAt: syncFinishedAt,
          sourceUpdatedAt: updatedAt,
          status: "success"
        }
      });
    });

    await capturePriceSnapshot(updatedAt);

    return {
      total: stations.length,
      updatedAt
    };
  } catch (error) {
    await prisma.syncState
      .upsert({
        where: {
          key: STATION_SYNC_KEY
        },
        update: {
          lastAttemptAt: syncStartedAt,
          status: "error"
        },
        create: {
          key: STATION_SYNC_KEY,
          lastAttemptAt: syncStartedAt,
          status: "error"
        }
      })
      .catch(() => undefined);

    throw error;
  }
}

let refreshPromise: Promise<void> | null = null;

export async function ensureStationsFresh() {
  const [total, syncState, latestSnapshot] = await Promise.all([
    prisma.station.count(),
    prisma.syncState.findUnique({
      where: {
        key: STATION_SYNC_KEY
      },
      select: {
        lastSuccessAt: true
      }
    }),
    prisma.fuelPriceSnapshot.findFirst({
      orderBy: {
        capturedAt: "desc"
      }
    })
  ]);

  const hasFreshData =
    total > 0 &&
    syncState?.lastSuccessAt != null &&
    Date.now() - syncState.lastSuccessAt.getTime() < STATION_SYNC_INTERVAL_MS;

  if (hasFreshData) {
    if (total > 0 && syncState?.lastSuccessAt && !latestSnapshot) {
      await capturePriceSnapshot(syncState.lastSuccessAt);
    }
    return;
  }

  if (!refreshPromise) {
    refreshPromise = syncStations()
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  await refreshPromise;
}

export async function ensureStationsSeeded() {
  await ensureStationsFresh();
}
