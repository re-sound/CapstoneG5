// src/components/ChartTab.tsx
import React, { useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Punto = {
  ts: string;
  AMB_OUT: number | "OUT";
  AMB_RET: number | "OUT";
  PULP_1: number | "OUT";
  PULP_2: number | "OUT";
  PULP_3: number | "OUT";
  PULP_4: number | "OUT";
};

type Rango = { min: number; max: number; idealMin: number; idealMax: number };

export default function ChartTab({
  historico,
  rango,
  titulo = "Tiempo real (simulado)",
}: {
  historico: Punto[];
  rango: Rango;
  titulo?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { xAxisData, series } = useMemo(() => {
    const x = historico.map((h) =>
      new Date(h.ts).toLocaleTimeString([], { hour12: false })
    );

    const toNum = (v: number | "OUT") => (typeof v === "number" ? v : null);

    const build = (name: string, key: keyof Punto) => ({
      name,
      type: "line",
      showSymbol: false,
      connectNulls: true,
      data: historico.map((h) => toNum(h[key])),
    });

    const seriesArr = [
      build("Ambiente (salida)", "AMB_OUT"),
      build("Ambiente (retorno)", "AMB_RET"),
      build("Pulpa 1", "PULP_1"),
      build("Pulpa 2", "PULP_2"),
      build("Pulpa 3", "PULP_3"),
      build("Pulpa 4", "PULP_4"),
    ];

    return { xAxisData: x, series: seriesArr };
  }, [historico]);

  const option = useMemo(
    () => ({
      backgroundColor: "transparent",
      title: { text: titulo, left: "center", textStyle: { color: "#e2e8f0" } },
      tooltip: { trigger: "axis" },
      legend: {
        top: 28,
        textStyle: { color: "#cbd5e1" },
      },
      grid: { left: 40, right: 20, top: 60, bottom: 40 },
      xAxis: {
        type: "category",
        data: xAxisData,
        axisLine: { lineStyle: { color: "#64748b" } },
        axisLabel: { color: "#94a3b8" },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#64748b" } },
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { color: "#334155" } },
      },
      dataZoom: [
        { type: "inside" },
        { type: "slider", height: 18, bottom: 10 },
      ],
      toolbox: {
        right: 10,
        feature: {
          saveAsImage: { title: "PNG" },
          restore: {},
          dataZoom: {},
        },
        iconStyle: { borderColor: "#94a3b8" },
      },
      series,
      // Banda “ideal”
      visualMap: [
        {
          show: false,
          pieces: [
            { gt: rango.idealMin, lt: rango.idealMax, color: "#10b981" }, // verde
          ],
          outOfRange: { color: "#60a5fa" }, // azules por fuera del ideal
        },
      ],
      // Alternativa visual con markArea sobre el eje Y:
      markArea: {
        silent: true,
      },
    }),
    [xAxisData, series, titulo, rango]
  );

  async function exportPNG() {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: null,
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `tunnel-chart.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function exportPDF() {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: "#0f172a", // para que no salga transparente en PDF
      scale: 2,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;
    pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
    pdf.save("tunnel-chart.pdf");
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-2">
        <button onClick={exportPNG} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm">
          Exportar PNG
        </button>
        <button onClick={exportPDF} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm">
          Exportar PDF
        </button>
      </div>

      <div
        ref={containerRef}
        className="rounded-xl border border-slate-700 bg-slate-800/40 p-2"
      >
        <ReactECharts
          option={option as any}
          style={{ width: "100%", height: 360 }}
          notMerge
          lazyUpdate
        />
      </div>
      <p className="text-xs text-slate-400 mt-2">
        Tip: usa el control inferior para hacer <b>zoom</b>, o el scroll sobre el gráfico.
      </p>
    </div>
  );
}
