export function CityStatsCard({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "primary" | "accent";
}) {
  const toneClass =
    tone === "primary"
      ? "border-primary/10 bg-primary/5"
      : tone === "accent"
        ? "border-emerald-200 bg-emerald-50"
        : "border-stroke bg-white";

  return (
    <div className={`rounded-[28px] border px-4 py-4 sm:px-5 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink sm:text-xl">{value}</p>
    </div>
  );
}
