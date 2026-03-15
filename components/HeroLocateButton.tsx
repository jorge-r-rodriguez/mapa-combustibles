"use client";

export function HeroLocateButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.localStorage.setItem("fuelmap:auto-locate", "1");
        document.getElementById("explorar-mapa")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="inline-flex items-center justify-center rounded-[1.4rem] bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      Encontrar gasolina barata cerca de mí
    </button>
  );
}
