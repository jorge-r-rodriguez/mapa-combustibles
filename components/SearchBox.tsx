"use client";

import { useEffect, useState } from "react";
import type { StationListItem } from "@/lib/types";

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function SearchBox({
  onSelect
}: {
  onSelect: (station: StationListItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StationListItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por ciudad o código postal"
        className="h-14 w-full rounded-[1.4rem] border border-white/80 bg-white/92 px-5 text-sm text-slate-700 shadow-panel outline-none transition placeholder:text-slate-400 focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
      />
      {(results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 rounded-3xl border border-stroke bg-white p-2 shadow-panel">
          {loading ? (
            <p className="px-4 py-3 text-sm text-slate-500">Buscando estaciones...</p>
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
                className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-ink">{station.city}</p>
                  <p className="text-sm text-slate-500">
                    {station.province}
                    {station.postalCode ? ` · ${station.postalCode}` : ""}
                  </p>
                </div>
                <span className="text-sm text-primary">Ver zona</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
