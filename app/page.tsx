import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { FuelMapExperience } from "@/components/FuelMapExperience";
import { getAllPostsMeta } from "@/lib/blog";
import { getFilterOptions, getHomepageInsights } from "@/lib/stations";
import { formatNumber } from "@/lib/utils";

export const revalidate = 900;

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function HomePage() {
  const [filterOptions, insights, posts] = await Promise.all([
    getFilterOptions(),
    getHomepageInsights(),
    Promise.resolve(getAllPostsMeta().slice(0, 3))
  ]);

  return (
    <>
      <Navbar />
      <main className="pb-20">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="container-app pt-8 sm:pt-12">
          <div className="panel gradient-border overflow-hidden bg-hero-grid px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:items-center">
              <div>
                <p className="section-kicker">Fuel intelligence para conductores</p>
                <h1 className="section-title mt-4 max-w-4xl text-4xl sm:text-[3.5rem] sm:leading-[1.02]">
                  Encuentra la gasolina más barata cerca de ti
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  FuelMap España cruza el dataset oficial del gobierno con un mapa optimizado para
                  detectar al momento qué estación te conviene por ubicación, provincia, marca o
                  rango de precio.
                </p>

                {/* Stat pills */}
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
              </div>

              {/* Radar del día */}
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

        {/* ── Map section ─────────────────────────────────── */}
        <section className="container-app mt-8">
          <FuelMapExperience
            provinces={filterOptions.provinces}
            brands={filterOptions.brands}
            insights={insights}
          />
        </section>

        {/* ── Rankings + Blog ─────────────────────────────── */}
        <section className="container-app mt-14 grid gap-6 lg:grid-cols-2">
          {/* Ranking nacional */}
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

          {/* Blog */}
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
