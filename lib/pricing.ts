import type { PriceTone } from "./types";

export function getPriceToneFromThresholds(
  value: number | null | undefined,
  thresholds: {
    cheapMax: number;
    expensiveMin: number;
  }
): PriceTone {
  if (value == null) {
    return "average";
  }

  if (value <= thresholds.cheapMax) {
    return "cheap";
  }

  if (value >= thresholds.expensiveMin) {
    return "expensive";
  }

  return "average";
}

export function getPriceThresholds(values: number[]) {
  if (!values.length) {
    return {
      cheapMax: 0,
      expensiveMin: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const cheapIndex = Math.floor((sorted.length - 1) * 0.33);
  const expensiveIndex = Math.floor((sorted.length - 1) * 0.66);

  return {
    cheapMax: sorted[cheapIndex],
    expensiveMin: sorted[expensiveIndex]
  };
}

export function getPriceToneMeta(tone: PriceTone) {
  switch (tone) {
    case "cheap":
      return {
        label: "Barato",
        bgClass: "bg-emerald-50",
        textClass: "text-emerald-700",
        ringClass: "ring-emerald-200",
        markerClass: "fuel-marker--cheap",
        heatWeight: 0.2
      };
    case "expensive":
      return {
        label: "Caro",
        bgClass: "bg-rose-50",
        textClass: "text-rose-700",
        ringClass: "ring-rose-200",
        markerClass: "fuel-marker--expensive",
        heatWeight: 1
      };
    default:
      return {
        label: "Media",
        bgClass: "bg-amber-50",
        textClass: "text-amber-700",
        ringClass: "ring-amber-200",
        markerClass: "fuel-marker--average",
        heatWeight: 0.6
      };
  }
}
