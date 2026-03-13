import { NextResponse } from "next/server";
import { getStationsNear } from "@/lib/stations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const radius = Number(searchParams.get("radius") ?? "15");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "Debes indicar lat y lon válidos." },
      { status: 400 }
    );
  }

  const stations = await getStationsNear({
    lat,
    lon,
    radius,
    fuel: (searchParams.get("fuel") as "gas95" | "diesel" | null) ?? "gas95"
  });

  return NextResponse.json(
    { stations },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900"
      }
    }
  );
}
