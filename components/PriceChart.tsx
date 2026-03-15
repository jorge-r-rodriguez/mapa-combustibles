"use client";

import { useEffect, useState } from "react";
import type { StationListItem } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const COLORS = ["#0b63f6", "#1a7df8", "#21a3ff", "#18b56b", "#17a34a", "#f59e0b", "#ef4444"];

export function PriceChart({ stations }: { stations: StationListItem[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!stations.length) {
    return (
      <div className="panel-muted flex min-h-[320px] items-center justify-center p-6 text-sm text-slate-500">
        No hay datos suficientes para generar el gráfico.
      </div>
    );
  }

  if (!mounted) {
    return <div className="panel-muted h-[340px] p-4 sm:h-[380px] sm:p-5" />;
  }

  const data = stations.map((station) => ({
    id: station.id,
    marca: station.brand,
    precio: station.priceGas95 ?? 0,
    direccion: station.address
  }));

  return (
    <div className="panel-muted h-[340px] p-4 sm:h-[380px] sm:p-5">
      <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={280}>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe5ea" />
          <XAxis
            dataKey="marca"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={56}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            domain={["dataMin - 0.01", "dataMax + 0.01"]}
          />
          <Tooltip
            cursor={{ fill: "rgba(11,99,246,0.06)" }}
            contentStyle={{
              borderRadius: 18,
              borderColor: "#dbe5ea",
              boxShadow: "0 18px 50px rgba(15,23,42,0.10)"
            }}
            formatter={(value) => [`${Number(value ?? 0).toFixed(3)} €/l`, "Gasolina 95"]}
            labelFormatter={(label) => `Estación: ${label}`}
          />
          <Bar dataKey="precio" radius={[16, 16, 6, 6]}>
            {data.map((entry, index) => (
              <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
