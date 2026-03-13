import Link from "next/link";

const links = [
  { href: "/", label: "Mapa" },
  { href: "/blog", label: "Blog" },
  { href: "/gasolina-barata/madrid", label: "Ciudades" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-background/80 backdrop-blur">
      <div className="container-app flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-glow">
            FM
          </div>
          <div>
            <p className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight">
              FuelMap España
            </p>
            <p className="text-sm text-muted">Gasolineras y precios oficiales</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
