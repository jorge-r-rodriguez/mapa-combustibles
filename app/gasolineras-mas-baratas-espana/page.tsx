import { NationalCheapestStations } from "@/components/NationalCheapestStations";
import { Navbar } from "@/components/Navbar";
import { getFilterOptions, getNationalCheapestStations } from "@/lib/stations";

export const metadata = {
  title: "Gasolineras más baratas de España",
  description: "Ranking nacional con mapa, filtros por provincia y tabla ordenable de las estaciones más baratas de España."
};

export const revalidate = 900;

export default async function CheapestStationsSpainPage() {
  const [gasRanking, dieselRanking, filterOptions] = await Promise.all([
    getNationalCheapestStations({ fuel: "gas95", limit: 250 }),
    getNationalCheapestStations({ fuel: "diesel", limit: 250 }),
    getFilterOptions()
  ]);

  return (
    <>
      <Navbar />
      <main className="container-app py-10 sm:py-12">
        <div className="max-w-4xl">
          <p className="section-kicker">Ranking nacional</p>
          <h1 className="section-title mt-4 text-4xl sm:text-5xl">
            Gasolineras más baratas de España
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Explora el ranking nacional de estaciones más competitivas con mapa, heatmap de precios,
            filtros por provincia y tabla ordenable.
          </p>
        </div>

        <section className="mt-8">
          <NationalCheapestStations
            initialFuel="gas95"
            gasStations={gasRanking.stations}
            gasGeoJson={gasRanking.geoJson}
            dieselStations={dieselRanking.stations}
            dieselGeoJson={dieselRanking.geoJson}
            provinces={filterOptions.provinces}
          />
        </section>
      </main>
    </>
  );
}
