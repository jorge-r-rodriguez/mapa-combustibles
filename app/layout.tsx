import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "@/app/globals.css";
import { ScrollToTopOnRouteChange } from "@/components/ScrollToTopOnRouteChange";
import { env } from "@/lib/env";

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "FuelMap España | Gasolineras baratas en tiempo real",
    template: "%s | FuelMap España"
  },
  description:
    "Mapa interactivo con gasolineras de España y precios oficiales de gasolina 95 y diésel para encontrar la opción más barata cerca de ti.",
  keywords: [
    "gasolina barata",
    "gasolineras españa",
    "precio gasolina 95",
    "precio diésel",
    "mapa gasolineras"
  ]
};

function FuelDropLogo() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0C19 9.5 12 2 12 2Z"
          fill="white"
          fillOpacity="0.95"
        />
      </svg>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${heading.variable} ${body.variable}`}>
      <body className="font-[family-name:var(--font-body)]">
        <ScrollToTopOnRouteChange />
        {children}

        <footer className="mt-4 border-t border-stroke/80 bg-surface/60 py-12">
          <div className="container-app">
            <div className="grid gap-10 sm:grid-cols-[1fr_auto_auto]">
              {/* Brand */}
              <div className="flex flex-col gap-3">
                <Link href="/" className="flex items-center gap-2.5">
                  <FuelDropLogo />
                  <span className="font-[family-name:var(--font-heading)] font-semibold tracking-tight text-ink">
                    FuelMap España
                  </span>
                </Link>
                <p className="max-w-xs text-sm leading-6 text-muted">
                  Precios oficiales del Ministerio actualizados varias veces al día para ayudarte a
                  encontrar la gasolinera más barata.
                </p>
              </div>

              {/* Navigation */}
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Navegación
                </p>
                <ul className="flex flex-col gap-2 text-sm text-slate-600">
                  <li>
                    <Link href="/" className="transition hover:text-primary">Mapa interactivo</Link>
                  </li>
                  <li>
                    <Link href="/blog" className="transition hover:text-primary">Blog</Link>
                  </li>
                  <li>
                    <Link href="/gasolina-barata/madrid" className="transition hover:text-primary">
                      Ciudades
                    </Link>
                  </li>
                  <li>
                    <Link href="/gasolineras-mas-baratas-espana" className="transition hover:text-primary">
                      Ranking nacional
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal / Info */}
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Datos
                </p>
                <ul className="flex flex-col gap-2 text-sm text-slate-600">
                  <li>Dataset oficial del Ministerio</li>
                  <li>Actualización cada 15 min</li>
                  <li>Todas las provincias de España</li>
                </ul>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-2 border-t border-stroke/60 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} FuelMap España. Datos provistos por el MITERD.</p>
              <p>Precios orientativos — confirma siempre en la estación.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
