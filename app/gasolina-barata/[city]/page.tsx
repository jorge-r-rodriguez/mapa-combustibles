import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CityStatsCard } from "@/components/CityStatsCard";
import { MapCard } from "@/components/MapCard";
import { Navbar } from "@/components/Navbar";
import { PriceChart } from "@/components/PriceChart";
import { StationCard } from "@/components/StationCard";
import { StationsMap } from "@/components/StationsMap";
import { getAvailableCitySlugs, getCityPageData } from "@/lib/stations";
import { formatDate } from "@/lib/utils";

export const revalidate = 900;

export async function generateStaticParams() {
  const slugs = await getAvailableCitySlugs(20);
  return slugs.map((city) => ({ city }));
}

export async function generateMetadata({
  params
}: {
  params: { city: string };
}): Promise<Metadata> {
  const page = await getCityPageData(params.city);

  if (!page) {
    return {
      title: "Gasolina barata"
    };
  }

  return {
    title: `Gasolina barata en ${page.city}`,
    description: `Ranking, precios medios y mapa de gasolineras baratas en ${page.city}, ${page.province}.`
  };
}

export default async function CheapCityPage({ params }: { params: { city: string } }) {
  const page = await getCityPageData(params.city);

  if (!page) {
    notFound();
  }

  const cheapestStation = page.cheapest[0];
  const savings =
    page.avgGas95 != null && cheapestStation?.priceGas95 != null
      ? page.avgGas95 - cheapestStation.priceGas95
      : null;

  return (
    <>
      <Navbar />
      <main className="container-app py-10 sm:py-12">
        <section className="max-w-5xl">
          <p className="section-kicker">SEO por ciudad</p>
          <h1 className="section-title mt-4 text-4xl sm:text-5xl">
            Gasolina barata en {page.city}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Consulta el mapa local, la comparativa de precios y la mejor estación disponible ahora
            en {page.city}, {page.province}.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CityStatsCard
              label="Precio medio gasolina"
              value={page.avgGas95 != null ? `${page.avgGas95.toFixed(3)} €/l` : "--"}
              tone="primary"
            />
            <CityStatsCard
              label="Precio medio diésel"
              value={page.avgDiesel != null ? `${page.avgDiesel.toFixed(3)} €/l` : "--"}
              tone="accent"
            />
            <CityStatsCard
              label="Gasolinera más barata"
              value={cheapestStation ? `${cheapestStation.brand} · ${cheapestStation.priceGas95?.toFixed(3)} €/l` : "--"}
            />
            <CityStatsCard
              label="Fecha de actualización"
              value={formatDate(page.updatedAt)}
            />
          </div>
        </section>

        <section className="mt-8">
          <MapCard
            title={`Mapa de gasolineras en ${page.city}`}
            subtitle="Explora las estaciones de la ciudad con marcadores por precio, heatmap opcional y shortlist local de las opciones más competitivas."
            aside={
              <div className="flex h-full min-h-0 flex-col">
                <div className="border-b border-stroke px-5 py-5">
                  <p className="text-sm text-slate-600">
                    Shortlist local con las estaciones más competitivas para gasolina 95.
                  </p>
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {page.cheapest.slice(0, 6).map((station) => (
                    <StationCard key={station.id} station={station} fuel="gas95" compact />
                  ))}
                </div>
              </div>
            }
          >
            <StationsMap
              center={[page.center.lat, page.center.lon]}
              zoom={12}
              fuel="gas95"
              showHeatmap
              stations={page.geoJson}
            />
          </MapCard>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_340px]">
          <div className="panel p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent-dark">
              Gráfico
            </p>
            <h2 className="section-title mt-3 text-3xl">Comparativa de precios en la ciudad</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Visualiza de un vistazo las estaciones con gasolina 95 más competitiva en {page.city}.
            </p>
            <div className="mt-6">
              <PriceChart stations={page.chart} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="panel p-6">
              <p className="section-kicker">Resumen local</p>
              <h2 className="section-title mt-3 text-2xl">Lo más útil antes de repostar</h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                <div className="rounded-3xl bg-slate-50 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Mejor estación ahora
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {cheapestStation?.brand ?? "No disponible"}
                  </p>
                  <p className="text-sm text-slate-500">{cheapestStation?.address ?? ""}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-3xl border border-stroke px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Mejor precio
                    </p>
                    <p className="mt-1 text-lg font-semibold text-primary">
                      {cheapestStation?.priceGas95?.toFixed(3) ?? "--"} €/l
                    </p>
                  </div>
                  <div className="rounded-3xl border border-stroke px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Ahorro frente a media
                    </p>
                    <p className="mt-1 text-lg font-semibold text-accent-dark">
                      {savings != null ? `${savings.toFixed(3)} €/l` : "--"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                Navegación
              </p>
              <h2 className="section-title mt-3 text-2xl">Explora otras zonas</h2>
              <div className="mt-5 space-y-3">
                <Link
                  href="/"
                  className="block rounded-3xl border border-stroke px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-primary/25 hover:bg-slate-50"
                >
                  Volver al mapa general de España
                </Link>
                <Link
                  href="/blog"
                  className="block rounded-3xl border border-stroke px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-primary/25 hover:bg-slate-50"
                >
                  Ver análisis y consejos del blog
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 panel p-6 sm:p-8">
          <div className="max-w-3xl">
            <p className="section-kicker">Ranking local</p>
            <h2 className="section-title mt-3 text-3xl">Estaciones más baratas ahora</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Una vista más completa de las opciones de repostaje en {page.city} para que no dependas
              solo del mapa.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {page.cheapest.slice(0, 10).map((station) => (
              <StationCard key={`${station.id}-ranking`} station={station} fuel="gas95" compact />
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
