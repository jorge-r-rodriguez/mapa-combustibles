"use client";

import type { FuelType } from "@/lib/types";

type FilterState = {
  fuel: FuelType;
  province: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
};

const DEFAULT_FILTERS: FilterState = {
  fuel: "gas95",
  province: "",
  brand: "",
  minPrice: "",
  maxPrice: ""
};

function FuelIcon({ type }: { type: "gas" | "diesel" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      {type === "gas" ? (
        <>
          <rect x="3" y="6" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M10 6V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 6V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M15 8l3-2v9a2 2 0 0 1-2 2h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0C19 9.5 12 2 12 2Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
          <path d="M9 15a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function hasActiveFilters(filters: FilterState) {
  return (
    filters.province !== DEFAULT_FILTERS.province ||
    filters.brand !== DEFAULT_FILTERS.brand ||
    filters.minPrice !== DEFAULT_FILTERS.minPrice ||
    filters.maxPrice !== DEFAULT_FILTERS.maxPrice
  );
}

export function FilterPanel({
  filters,
  provinces,
  brands,
  onChange
}: {
  filters: FilterState;
  provinces: string[];
  brands: string[];
  onChange: (next: FilterState) => void;
}) {
  const isDirty = hasActiveFilters(filters);

  return (
    <section className="panel p-4 sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)_220px] xl:items-end">
        {/* Fuel type toggle */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Combustible
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...filters, fuel: "gas95" })}
              aria-pressed={filters.fuel === "gas95"}
              className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl px-2 py-3 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${filters.fuel === "gas95"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              <FuelIcon type="gas" />
              Gasolina 95
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...filters, fuel: "diesel" })}
              aria-pressed={filters.fuel === "diesel"}
              className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl px-2 py-3 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${filters.fuel === "diesel"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              <FuelIcon type="diesel" />
              Diésel
            </button>
          </div>
        </div>

        {/* Province */}
        <div>
          <label
            htmlFor="province"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
          >
            Provincia
          </label>
          <div className="relative">
            <select
              id="province"
              value={filters.province}
              onChange={(event) => onChange({ ...filters, province: event.target.value })}
              className="control-input appearance-none pr-9"
            >
              <option value="">Todas las provincias</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            <ChevronDownIcon />
          </div>
        </div>

        {/* Brand */}
        <div>
          <label
            htmlFor="brand"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
          >
            Marca
          </label>
          <input
            id="brand"
            list="brands"
            value={filters.brand}
            onChange={(event) => onChange({ ...filters, brand: event.target.value })}
            placeholder="Repsol, Galp, Shell..."
            className="control-input"
          />
          <datalist id="brands">
            {brands.map((brand) => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </div>

        {/* Price range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="minPrice"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Precio mín.
            </label>
            <div className="relative">
              <input
                id="minPrice"
                type="number"
                step="0.001"
                min="0"
                value={filters.minPrice}
                onChange={(event) => onChange({ ...filters, minPrice: event.target.value })}
                placeholder="1.450"
                className="control-input pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                €
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor="maxPrice"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Precio máx.
            </label>
            <div className="relative">
              <input
                id="maxPrice"
                type="number"
                step="0.001"
                min="0"
                value={filters.maxPrice}
                onChange={(event) => onChange({ ...filters, maxPrice: event.target.value })}
                placeholder="1.900"
                className="control-input pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clear filters */}
      {isDirty && (
        <div className="mt-4 flex animate-fade-in justify-end border-t border-stroke pt-4">
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_FILTERS, fuel: filters.fuel })}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Limpiar filtros
          </button>
        </div>
      )}
    </section>
  );
}
