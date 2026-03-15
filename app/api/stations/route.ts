import { NextResponse } from "next/server";
import { getStationsGeoJSON } from "@/lib/stations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bboxParam = searchParams.get("bbox");

  const minLat = searchParams.get("minLat");
  const minLon = searchParams.get("minLon");
  const maxLat = searchParams.get("maxLat");
  const maxLon = searchParams.get("maxLon");
  const parsedBbox = bboxParam
    ?.split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));

  const collection = await getStationsGeoJSON({
    bbox:
      parsedBbox?.length === 4
        ? {
            minLat: parsedBbox[0],
            minLon: parsedBbox[1],
            maxLat: parsedBbox[2],
            maxLon: parsedBbox[3]
          }
        : minLat && minLon && maxLat && maxLon
        ? {
            minLat: Number(minLat),
            minLon: Number(minLon),
            maxLat: Number(maxLat),
            maxLon: Number(maxLon)
          }
        : undefined,
    province: searchParams.get("province") || undefined,
    brand: searchParams.get("brand") || undefined,
    city: searchParams.get("city") || undefined,
    postalCode: searchParams.get("postalCode") || undefined,
    fuel: (searchParams.get("fuel") as "gas95" | "diesel" | null) ?? undefined,
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined
  });

  return NextResponse.json(
    {
      collection
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600"
      }
    }
  );
}
