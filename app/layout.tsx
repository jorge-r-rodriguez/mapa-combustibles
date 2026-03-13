import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "@/app/globals.css";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${heading.variable} ${body.variable}`}>
      <body className="font-[family-name:var(--font-body)]">
        {children}
        <footer className="border-t border-stroke/80 py-10">
          <div className="container-app flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>FuelMap España usa el dataset oficial del Ministerio para mostrar precios normalizados.</p>
            <div className="flex gap-5">
              <Link href="/blog" className="hover:text-primary">
                Blog
              </Link>
              <Link href="/gasolina-barata/madrid" className="hover:text-primary">
                SEO por ciudad
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
