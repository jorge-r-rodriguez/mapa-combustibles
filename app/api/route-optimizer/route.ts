import { NextResponse } from "next/server";
import { z } from "zod";
import { optimizeRouteRefuel } from "@/lib/route-optimizer";

const querySchema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  fuel: z.enum(["gas95", "diesel"]).default("gas95")
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    origin: searchParams.get("origin"),
    destination: searchParams.get("destination"),
    fuel: searchParams.get("fuel") ?? "gas95"
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Debes indicar origen, destino y combustible válidos." },
      { status: 400 }
    );
  }

  const result = await optimizeRouteRefuel(parsed.data);

  if (!result) {
    return NextResponse.json(
      { error: "No se pudo resolver una ruta con los datos indicados." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { result },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900"
      }
    }
  );
}
