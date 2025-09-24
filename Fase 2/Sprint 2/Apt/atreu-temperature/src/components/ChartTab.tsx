// src/components/ChartTab.tsx
import React from "react";
import ReactECharts from "echarts-for-react";

/**
 * Gráfico interactivo con ECharts:
 * - Zoom (rueda/drag), pan
 * - Leyenda clicable para ocultar/mostrar series
 * - Tooltips por punto
 * - Exportar como PNG (toolbox)
 * - dataZoom (barra deslizante + zoom interno)
 * Recibe el mismo "historico" que ya usas en TunnelDetail.
 */
export default function ChartTab({ historico }: { historico: any[] }) {
  if (!historico || historico.length === 0) {
    return <div className="text-sm text-slate-400">No hay datos disponibles.</div>;
  }

  // Claves numéricas a graficar (excluye 'ts' y valores "OUT")
  const sample = historico[0] ?? {};
  const numericKeys = Object.keys(sample)
    .filter((k) => k !== "ts")
    .filter((k) => isFiniteNum(sample[k]) || hasSomeNumeric(historico, k));

  // Eje X con timestamps legibles
  const categories = historico.map((row) =>
    row.ts ? new Date(row.ts).toLocaleTimeString() : ""
  );

  // Series por clave
  const palette = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"];
  const series = numericKeys.map((k, idx) => ({
    name: k,
    type: "line",
    smooth: true,
    showSymbol: false,
    symbolSize: 6,
    lineStyle: { width: 2 },
    itemStyle: { color: palette[idx % palette.length] },
    data: historico.map((row) => (isFiniteNum(row[k]) ? Number(row[k]) : null)),
    // Conectar gaps: si quieres líneas continuas aunque haya nulls, cambia a true
    connectNulls: false,
  }));

  const option = {
    backgroundColor: "transparent",
    color: palette,
    grid: { left: 48, right: 24, top: 36, bottom: 48 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15,23,42,0.95)",
      borderColor: "#334155",
      textStyle: { color: "#e2e8f0" },
      axisPointer: { type: "line" },
    },
    legend: {
      top: 4,
      textStyle: { color: "#cbd5e1" },
    },
    xAxis: {
      type: "category",
      data: categories,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#64748b" } },
      axisLabel: { color: "#94a3b8" },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#64748b" } },
      splitLine: { lineStyle: { color: "#475569", type: "dashed" } },
      axisLabel: {
        color: "#94a3b8",
        formatter: (v: number) => `${v.toFixed(1)}°C`,
      },
    },
    dataZoom: [
      { type: "inside", throttle: 50 }, // zoom con rueda y gesto
      { type: "slider", height: 16, bottom: 12 }, // barra deslizante
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
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-2">
      <ReactECharts option={option} style={{ height: 340, width: "100%" }} notMerge={true} />
      <div className="text-xs text-slate-400 mt-2">
        Interactivo: zoom (rueda/drag), pan, leyenda clicable y exportar PNG (icono cámara).
      </div>
    </div>
  );
}

function isFiniteNum(v: any): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function hasSomeNumeric(rows: any[], key: string) {
  return rows.some((r) => isFiniteNum(r?.[key]));
}
