"use client";

import { useEffect, useRef, useState } from "react";
import type { StationListItem } from "@/lib/types";

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
    >
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-slate-400"
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-500">
      <div className="h-4 w-4 animate-spin-custom rounded-full border-2 border-slate-200 border-t-primary" />
      Buscando estaciones...
    </div>
  );
}

export function SearchBox({
  onSelect
}: {
  onSelect: (station: StationListItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as { results: StationListItem[] };
        if (!controller.signal.aborted) {
          setResults(data.results ?? []);
        }
      } catch (error) {
        if (!isAbortError(error)) {
          setResults([]);
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  const showDropdown = results.length > 0 || loading;

  return (
    <div className="relative">
      <div className="relative">
        <SearchIcon />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por ciudad o código postal"
          aria-label="Buscar estación de servicio"
          className="h-14 w-full rounded-[1.4rem] border border-white/80 bg-white/92 pl-11 pr-10 text-sm text-slate-700 shadow-panel outline-none transition placeholder:text-slate-400 focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
        />
        {/* Clear button */}
        {query.length > 0 && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="animate-slide-down absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 rounded-3xl border border-stroke bg-white p-2 shadow-panel">
          {loading ? (
            <LoadingSpinner />
          ) : (
            results.map((station) => (
              <button
                key={`${station.id}-${station.postalCode ?? ""}`}
                type="button"
                onClick={() => {
                  onSelect(station);
                  setQuery(`${station.city}${station.postalCode ? ` · ${station.postalCode}` : ""}`);
                  setResults([]);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <PinIcon />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{station.city}</p>
                  <p className="text-sm text-slate-500">
                    {station.province}
                    {station.postalCode ? ` · ${station.postalCode}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-primary">Ver zona →</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
