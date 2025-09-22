// src/components/InteractiveChart.tsx
import { useEffect, useMemo, useRef, useState } from "react";

type Row = {
  ts: string; // ISO
  AMB_OUT: number | "OUT";
  AMB_RET: number | "OUT";
  PULP_1: number | "OUT";
  PULP_2: number | "OUT";
  PULP_3: number | "OUT";
  PULP_4: number | "OUT";
};

const SERIES: { key: keyof Row; label: string }[] = [
  { key: "AMB_OUT", label: "AMB 1 Salida" },
  { key: "AMB_RET", label: "AMB 2 Retorno" },
  { key: "PULP_1", label: "Pulp 1" },
  { key: "PULP_2", label: "Pulp 2" },
  { key: "PULP_3", label: "Pulp 3" },
  { key: "PULP_4", label: "Pulp 4" },
];

export default function InteractiveChart({ data, title }: { data: Row[]; title?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SERIES.map(s => [s.key, s.key === "AMB_OUT" || s.key === "AMB_RET" || s.key === "PULP_1"]))
  );
  const [domain, setDomain] = useState<{ x0: number; x1: number }>(() => {
    const xs = data.map(d => new Date(d.ts).getTime());
    return { x0: Math.min(...xs), x1: Math.max(...xs) };
  });

  // pan/zoom
  useEffect(() => {
    const cvs = canvasRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { left, width } = cvs.getBoundingClientRect();
      const mouseX = e.clientX - left;
      const frac = mouseX / width;
      const range = domain.x1 - domain.x0;
      const zoomFactor = e.deltaY > 0 ? 1.2 : 1 / 1.2;
      const newRange = range * zoomFactor;
      const center = domain.x0 + range * frac;
      const x0 = center - newRange * frac;
      const x1 = x0 + newRange;
      setDomain({ x0, x1 });
    };
    let dragging = false, lastX = 0;
    const onDown = (e: MouseEvent) => { dragging = true; lastX = e.clientX; };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      const { width } = cvs.getBoundingClientRect();
      const range = domain.x1 - domain.x0;
      const pixelsPerMs = width / range;
      const shift = dx / pixelsPerMs;
      setDomain(d => ({ x0: d.x0 - shift, x1: d.x1 - shift }));
    };
    const onUp = () => { dragging = false; };

    cvs.addEventListener("wheel", onWheel, { passive: false });
    cvs.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      cvs.removeEventListener("wheel", onWheel);
      cvs.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [domain]);

  // dibujo
  useEffect(() => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    const DPR = window.devicePixelRatio || 1;
    const w = cvs.clientWidth * DPR, h = cvs.clientHeight * DPR;
    cvs.width = w; cvs.height = h;

    ctx.clearRect(0, 0, w, h);
    // fondo
    ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, w, h);

    // ejes
    const pad = 40 * DPR;
    const plotW = w - pad - 10 * DPR;
    const plotH = h - pad - 10 * DPR;

    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1 * DPR;
    ctx.beginPath();
    ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + plotH); ctx.lineTo(pad + plotW, pad + plotH);
    ctx.stroke();

    // Y domain
    const nums: number[] = [];
    data.forEach(d => {
      SERIES.forEach(s => {
        if (!visible[s.key]) return;
        const v = d[s.key]; if (typeof v === "number") nums.push(v);
      });
    });
    const yMin = (Math.min(...nums) || 0) - 1;
    const yMax = (Math.max(...nums) || 10) + 1;

    const xToPx = (x: number) => pad + ((x - domain.x0) * plotW) / (domain.x1 - domain.x0);
    const yToPx = (y: number) => pad + plotH - ((y - yMin) * plotH) / (yMax - yMin);

    // grid horizontal
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1 * DPR;
    const steps = 4;
    for (let i = 1; i <= steps; i++) {
      const y = pad + (plotH * i) / (steps + 1);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + plotW, y); ctx.stroke();
    }

    // series
    const colors = ["#38bdf8","#22d3ee","#34d399","#fde047","#f472b6","#a78bfa"];
    SERIES.forEach((s, idx) => {
      if (!visible[s.key]) return;
      ctx.strokeStyle = colors[idx % colors.length];
      ctx.lineWidth = 2 * DPR; ctx.beginPath();
      let started = false;
      data.forEach(d => {
        const x = new Date(d.ts).getTime();
        if (x < domain.x0 || x > domain.x1) return;
        const v = d[s.key];
        if (typeof v !== "number") { started = false; return; }
        const px = xToPx(x), py = yToPx(v);
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });

    // labels
    ctx.fillStyle = "#cbd5e1"; ctx.font = `${12*DPR}px system-ui, sans-serif`;
    ctx.fillText(new Date(domain.x0).toLocaleTimeString(), pad, h - 8*DPR);
    ctx.textAlign = "right";
    ctx.fillText(new Date(domain.x1).toLocaleTimeString(), pad + plotW, h - 8*DPR);
    ctx.textAlign = "left";
    ctx.fillText(`${title ?? "Histórico"}`, pad, 20*DPR);
  }, [data, domain, visible]);

  const toggles = useMemo(() => SERIES.map((s, i) => ({
    ...s,
    color: ["#38bdf8","#22d3ee","#34d399","#fde047","#f472b6","#a78bfa"][i % 6]
  })), []);

  const resetZoom = () => {
    const xs = data.map(d => new Date(d.ts).getTime());
    setDomain({ x0: Math.min(...xs), x1: Math.max(...xs) });
  };

  const exportPNG = () => {
    const cvs = canvasRef.current!;
    const a = document.createElement("a");
    a.href = cvs.toDataURL("image/png");
    a.download = `${(title ?? "grafico").replace(/\s+/g,"_")}.png`;
    a.click();
  };

  const exportPDF = () => {
    // Abrimos una ventana con la imagen; el usuario puede "Imprimir > Guardar como PDF"
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    const w = window.open("", "_blank", "width=900,height=600");
    if (!w) return;
    w.document.write(`
      <html><head><title>${title ?? "Gráfico"}</title>
      <style>
        body{margin:0; background:#0f172a; color:#e2e8f0; font-family:system-ui}
        .wrap{padding:24px}
        img{max-width:100%}
        .meta{margin:12px 0 24px; font-size:12px; opacity:.8}
        @media print{ .actions{display:none} }
        button{background:#0ea5e9; border:none; color:white; padding:8px 12px; border-radius:8px}
      </style></head>
      <body>
        <div class="wrap">
          <h3>${title ?? "Gráfico"}</h3>
          <div class="meta">${new Date().toLocaleString()}</div>
          <img src="${dataUrl}"/>
          <div class="actions"><br/><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
        </div>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {toggles.map(t => (
          <label key={t.key} className="flex items-center gap-2 text-xs">
            <input type="checkbox" className="accent-sky-500" checked={!!visible[t.key]}
                   onChange={(e) => setVisible(prev => ({ ...prev, [t.key]: e.target.checked }))}/>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded" style={{ background: t.color }} />
              {t.label}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={resetZoom} className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs">
          Reset zoom
        </button>
        <button onClick={exportPNG} className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs">
          Exportar PNG
        </button>
        <button onClick={exportPDF} className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-xs">
          Exportar PDF
        </button>
        <span className="text-xs text-slate-400 ml-auto">Rueda = zoom, arrastra = pan</span>
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-[320px] block" />
      </div>
    </div>
  );
}
