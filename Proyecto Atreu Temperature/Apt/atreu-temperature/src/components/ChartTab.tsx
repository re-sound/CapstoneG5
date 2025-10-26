// src/components/ChartTab.tsx
import { useRef } from "react";
import ReactECharts from "echarts-for-react";

/**
 * Gráfico interactivo con ECharts:
 * - Zoom, pan, leyenda clicable, tooltips
 * - Exportar PNG (toolbox)
 * - dataZoom (inside + slider)
 * - Controles de rango de tiempo y reseteo
 *
 * NOTA: Se fuerza el uso de nombres legibles para sensores:
 * AMB_OUT, AMB_RET, IZQ_EXT_ENT, IZQ_INT_ENT, DER_INT_ENT, DER_EXT_ENT
 * Si el histórico no trae esas claves, se mapean desde PULP_1..4.
 */
export default function ChartTab({ 
  historico
}: { 
  historico: any[];
}) {
  const chartRef = useRef<any>(null);


  if (!historico || historico.length === 0) {
    return (
      <div className="text-sm text-slate-400 p-4 text-center">
        No hay datos disponibles. Espera a que el simulador inserte lecturas (~40s).
      </div>
    );
  }

  // Orden y nombres definitivos que queremos mostrar
  const TARGET_KEYS = [
    "AMB_OUT",
    "AMB_RET",
    "IZQ_EXT_ENT",
    "IZQ_INT_ENT",
    "DER_INT_ENT",
    "DER_EXT_ENT",
  ] as const;

  type TargetKey = (typeof TARGET_KEYS)[number];

  // Construimos una vista normalizada por fila con las 6 claves objetivo
  // Tomamos primero la clave alias si existe; si no, probamos con su PULP equivalente.
  const normalized = historico.map((row) => {
    const out: Record<TargetKey, number | null> = {
      AMB_OUT: pickNum(row, "AMB_OUT"),
      AMB_RET: pickNum(row, "AMB_RET"),
      IZQ_EXT_ENT:
        pickNum(row, "IZQ_EXT_ENT") ??
        pickNum(row, "PULP_3"),
      IZQ_INT_ENT:
        pickNum(row, "IZQ_INT_ENT") ??
        pickNum(row, "PULP_2"),
      DER_INT_ENT:
        pickNum(row, "DER_INT_ENT") ??
        pickNum(row, "PULP_1"),
      DER_EXT_ENT:
        pickNum(row, "DER_EXT_ENT") ??
        pickNum(row, "PULP_4"),
    };
    return { ts: row.ts, ...out };
  });

  // Eje X legible
  const categories = normalized.map((r) =>
    r.ts ? new Date(r.ts).toLocaleTimeString() : ""
  );

  // Palette estable
  const palette = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"];

  // Solo series que tengan al menos un número
  const activeKeys = TARGET_KEYS.filter((k) =>
    normalized.some((r) => isFiniteNum((r as any)[k]))
  );

  const series = activeKeys.map((k, idx) => ({
    name: k,
    type: "line",
    smooth: true,
    showSymbol: false,
    symbolSize: 6,
    lineStyle: { width: 2 },
    itemStyle: { color: palette[idx % palette.length] },
    data: normalized.map((r) => (isFiniteNum((r as any)[k]) ? Number((r as any)[k]) : null)),
    connectNulls: false,
  }));

  const option = {
    backgroundColor: "transparent",
    color: palette,
    grid: { left: 48, right: 24, top: 36, bottom: 48 },
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "rgba(15,23,42,0.95)",
      borderColor: "#334155",
      textStyle: { color: "#e2e8f0" },
      axisPointer: { type: "line" as const },
      valueFormatter: (v: number) => (Number.isFinite(v) ? `${v.toFixed(1)}°C` : "—"),
    },
    legend: {
      top: 4,
      textStyle: { color: "#cbd5e1" },
    },
    xAxis: {
      type: "category" as const,
      data: categories,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#64748b" } },
      axisLabel: { color: "#94a3b8" },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLine: { lineStyle: { color: "#64748b" } },
      splitLine: { lineStyle: { color: "#475569", type: "dashed" } },
      axisLabel: {
        color: "#94a3b8",
        formatter: (v: number) => `${Number(v).toFixed(1)}°C`,
      },
    },
    dataZoom: [
      { type: "inside", throttle: 50 },
      { type: "slider", height: 16, bottom: 12 },
    ],
    toolbox: {
      right: 8,
      feature: {
        dataZoom: { yAxisIndex: "none" },
        restore: {},
        saveAsImage: { name: "grafico-tunel" },
      },
      iconStyle: { borderColor: "#cbd5e1" },
      emphasis: { iconStyle: { borderColor: "#ffffff" } },
    },
    series,
  };

  return (
    <div className="space-y-3">
      {/* Gráfico */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-2">
        <ReactECharts 
          ref={chartRef}
          option={option} 
          style={{ height: 400, width: "100%" }} 
          notMerge={true}
        />
        <div className="text-xs text-slate-400 mt-2 px-2">
          Interactivo: zoom, exportar PNG .
        </div>
      </div>
    </div>
  );
}


function isFiniteNum(v: any): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function pickNum(obj: any, key: string): number | null {
  const v = obj?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
