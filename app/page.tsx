import Link from "next/link";
import { FuelIndexCard } from "@/components/FuelIndexCard";
import { FuelMapExperience } from "@/components/FuelMapExperience";
import { HeroLocateButton } from "@/components/HeroLocateButton";
import { Navbar } from "@/components/Navbar";
import { getAllPostsMeta } from "@/lib/blog";
import { getFilterOptions, getFuelIndexSummary, getHomepageInsights } from "@/lib/stations";
import { formatNumber } from "@/lib/utils";

export const revalidate = 900;

const MEDALS = ["🥇", "🥈", "🥉"];

const TRUST_ITEMS = [
  "12.000+ estaciones analizadas",
  "Datos oficiales del Ministerio",
  "Actualización cada 15 minutos"
];

export default async function HomePage() {
  const [filterOptions, insights, posts, fuelIndex] = await Promise.all([
    getFilterOptions(),
    getHomepageInsights(),
    Promise.resolve(getAllPostsMeta().slice(0, 3)),
    getFuelIndexSummary()
  ]);

  return (
    <>
      <Navbar />
      <main className="pb-20">
        <section className="container-app pt-8 sm:pt-12">
          <div className="panel gradient-border overflow-hidden bg-hero-grid px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_360px] lg:items-center">
              <div>
                <p className="section-kicker">Fuel intelligence para conductores</p>
                <h1 className="section-title mt-4 max-w-4xl text-4xl sm:text-[3.7rem] sm:leading-[1]">
                  Gasolineras baratas en España con mapa, calor de precios y rutas optimizadas
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  FuelMap España combina datos oficiales, analítica nacional y experiencia GIS para
                  encontrar la estación que más te conviene por ubicación, precio y recorrido.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <HeroLocateButton />
                  <Link
                    href="/gasolineras-mas-baratas-espana"
                    className="inline-flex items-center justify-center rounded-[1.4rem] border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver ranking nacional
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap gap-2.5 text-sm text-slate-600">
                  <span className="flex items-center gap-2 rounded-full bg-white/88 px-4 py-2 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {formatNumber(insights.totalStations)} estaciones
                  </span>
                  <span className="flex items-center gap-2 rounded-full bg-white/88 px-4 py-2 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Gasolina 95 media: {insights.avgGas95?.toFixed(3) ?? "--"} €/l
                  </span>
                  <span className="flex items-center gap-2 rounded-full bg-white/88 px-4 py-2 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    Diésel medio: {insights.avgDiesel?.toFixed(3) ?? "--"} €/l
                  </span>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {TRUST_ITEMS.map((item) => (
                    <div key={item} className="rounded-[24px] border border-white/60 bg-white/70 px-4 py-4">
                      <p className="text-sm font-medium text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Radar del día</p>
                <h2 className="section-title mt-3 text-2xl">Ciudades con combustible más barato</h2>
                <div className="mt-5 space-y-3">
                  {insights.cheapestCitiesGas95.slice(0, 3).map((city, index) => (
                    <Link
                      key={city.slug}
                      href={`/gasolina-barata/${city.slug}`}
                      className="flex items-center justify-between rounded-3xl border border-transparent bg-slate-50 px-4 py-3.5 transition hover:border-primary/15 hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl leading-none">{MEDALS[index]}</span>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                            Top {index + 1}
                          </p>
                          <p className="mt-0.5 text-[15px] font-semibold text-ink">{city.city}</p>
                          <p className="text-[13px] text-slate-500">{city.province}</p>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-accent-dark">
                        {city.avgPrice.toFixed(3)} €
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container-app mt-8 grid gap-4 lg:grid-cols-3">
          <FuelIndexCard
            label="Índice nacional gasolina 95"
            value={fuelIndex.avgGas95}
            variation={fuelIndex.weeklyDeltaGas95}
            updatedAt={fuelIndex.updatedAt}
          />
          <FuelIndexCard
            label="Índice nacional diésel"
            value={fuelIndex.avgDiesel}
            variation={fuelIndex.weeklyDeltaDiesel}
            updatedAt={fuelIndex.updatedAt}
          />
          <div className="panel p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Lectura rápida
            </p>
            <h2 className="section-title mt-3 text-2xl">Dónde hay más ahorro ahora</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Usa el mapa de calor para detectar clústeres baratos y el optimizador de ruta para no
              desviarte de más cuando estás viajando.
            </p>
            <div className="mt-4 rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Variación semanal calculada sobre snapshots históricos persistidos en la base local.
            </div>
          </div>
        </section>

        <section className="container-app mt-8">
          <FuelMapExperience
            provinces={filterOptions.provinces}
            brands={filterOptions.brands}
            insights={insights}
          />
        </section>

        <section className="container-app mt-14 grid gap-6 lg:grid-cols-2">
          <div className="panel p-8">
            <p className="section-kicker">Comparación rápida</p>
            <h2 className="section-title mt-3 text-3xl">Ranking nacional de gasolina 95</h2>
            <div className="mt-6 space-y-2.5">
              {insights.cheapestCitiesGas95.map((city, index) => (
                <Link
                  key={city.slug}
                  href={`/gasolina-barata/${city.slug}`}
                  className="flex items-center justify-between rounded-3xl border border-stroke px-4 py-3.5 transition hover:border-primary/30 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    {index < 3 ? (
                      <span className="text-base leading-none">{MEDALS[index]}</span>
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                        {index + 1}
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-ink">{city.city}</p>
                      <p className="text-sm text-slate-500">
                        {city.province} · {city.stationCount} estaciones
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-primary">{city.avgPrice.toFixed(3)} €</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent-dark">
              Blog y análisis
            </p>
            <h2 className="section-title mt-3 text-3xl">Guías para ahorrar combustible</h2>
            <div className="mt-6 space-y-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block rounded-3xl border border-stroke px-5 py-5 transition hover:border-accent/40 hover:bg-accent/5"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {post.readingTime}
                  </p>
                  <h3 className="mt-2 flex items-center justify-between gap-2 text-xl font-semibold text-ink">
                    <span>{post.title}</span>
                    <span className="translate-x-0 text-accent-dark opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
                      →
                    </span>
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
