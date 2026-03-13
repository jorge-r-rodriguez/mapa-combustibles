export type FuelType = "gas95" | "diesel";

export type StationListItem = {
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
  updatedAt: string;
  distanceKm?: number;
};

export type StationFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
    properties: StationListItem;
  }>;
};

export type StationsQuery = {
  bbox?: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  };
  province?: string;
  brand?: string;
  postalCode?: string;
  city?: string;
  fuel?: FuelType;
  minPrice?: number;
  maxPrice?: number;
  take?: number;
};

export type HomepageInsights = {
  totalStations: number;
  avgGas95: number | null;
  avgDiesel: number | null;
  updatedAt: string | null;
  cheapestCitiesGas95: Array<{
    city: string;
    province: string;
    slug: string;
    avgPrice: number;
    stationCount: number;
  }>;
  cheapestCitiesDiesel: Array<{
    city: string;
    province: string;
    slug: string;
    avgPrice: number;
    stationCount: number;
  }>;
};
