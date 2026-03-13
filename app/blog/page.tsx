import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getAllPostsMeta } from "@/lib/blog";

export const metadata = {
  title: "Blog de combustible",
  description: "Artículos en español sobre precios de gasolina, diésel y ahorro al repostar."
};

export default function BlogPage() {
  const posts = getAllPostsMeta();

  return (
    <>
      <Navbar />
      <main className="container-app py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
            Blog FuelMap España
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-heading)] text-5xl font-semibold tracking-tight text-ink">
            Análisis, tendencias y consejos para pagar menos al repostar
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Contenido en español orientado a conductores que quieren interpretar precios, detectar
            patrones y optimizar cada parada en la gasolinera.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="panel p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{post.readingTime}</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">{post.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>
              <p className="mt-4 text-sm font-medium text-primary">Leer artículo</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
