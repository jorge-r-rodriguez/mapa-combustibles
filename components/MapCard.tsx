export function MapCard({
  children,
  title,
  subtitle,
  aside,
  loading = false
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  aside: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <section className="panel overflow-hidden">
      {/* Loading bar */}
      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-slate-100">
          <div className="h-full animate-pulse bg-gradient-to-r from-primary/40 via-primary to-primary/40 [background-size:200%] [animation:shimmer_1.4s_ease_infinite]" />
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1.7fr)_390px] lg:items-start">
        {/* Map area */}
        <div className="min-w-0">
          <div className="border-b border-stroke px-5 py-5 sm:px-6">
            <p className="section-kicker">Mapa interactivo</p>
            <h2 className="section-title mt-2 text-2xl sm:text-[1.75rem]">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>
          {children}
        </div>

        {/* Aside (sticky header, scrollable list) */}
        <aside className="flex flex-col border-t border-stroke bg-slate-50/72 lg:h-[840px] lg:overflow-hidden lg:border-l lg:border-t-0">
          {aside}
        </aside>
      </div>
    </section>
  );
}
