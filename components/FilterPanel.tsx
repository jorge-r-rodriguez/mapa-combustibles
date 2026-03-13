"use client";

import type { FuelType } from "@/lib/types";

type FilterState = {
  fuel: FuelType;
  province: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
};

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
  return (
    <section className="panel p-4 sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)_220px] xl:items-end">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Combustible
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...filters, fuel: "gas95" })}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                filters.fuel === "gas95"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Gasolina 95
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...filters, fuel: "diesel" })}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                filters.fuel === "diesel"
                  ? "bg-accent text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Diésel
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="province"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
          >
            Provincia
          </label>
          <select
            id="province"
            value={filters.province}
            onChange={(event) => onChange({ ...filters, province: event.target.value })}
            className="control-input"
          >
            <option value="">Todas las provincias</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="minPrice"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Precio mínimo
            </label>
            <input
              id="minPrice"
              type="number"
              step="0.001"
              min="0"
              value={filters.minPrice}
              onChange={(event) => onChange({ ...filters, minPrice: event.target.value })}
              placeholder="1.450"
              className="control-input"
            />
          </div>
          <div>
            <label
              htmlFor="maxPrice"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Precio máximo
            </label>
            <input
              id="maxPrice"
              type="number"
              step="0.001"
              min="0"
              value={filters.maxPrice}
              onChange={(event) => onChange({ ...filters, maxPrice: event.target.value })}
              placeholder="1.900"
              className="control-input"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
