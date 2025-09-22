// src/components/TunnelDetail.tsx
import ChartTab from "./ChartTab";
import { useMemo, useRef, useState } from "react";
import Modal from "./Modal";
import Tabs, { TabItem } from "./Tabs";
import {
  TUNELES_MOCK,
  RANGOS_POR_FRUTA,
  getHistorico,
} from "../data/tunnelMock";

type Fruit = keyof typeof RANGOS_POR_FRUTA;
type RangeOverride = { min: number; max: number; idealMin: number; idealMax: number };

export default function TunnelDetail({
  tunnelId,
  open,
  onClose,
  frutaActual,             // opcional
  frutasDisponibles,       // opcional
  onChangeFruit,           // opcional
  rangeOverride,           // opcional
  onChangeRanges,          // opcional
}: {
  tunnelId: number;
  open: boolean;
  onClose: () => void;
  frutaActual?: Fruit;
  frutasDisponibles?: Fruit[];
  onChangeFruit?: (f: Fruit) => void;
  rangeOverride?: RangeOverride;
  onChangeRanges?: (r: RangeOverride) => void;
}) {
  const tun = TUNELES_MOCK.find(t => t.id === tunnelId)!;

  // Defaults inteligentes
  const initialFruit: Fruit = (frutaActual ?? tun.fruta) as Fruit;
  const availableFruits: Fruit[] = (frutasDisponibles ?? (Object.keys(RANGOS_POR_FRUTA) as Fruit[]));
  const initialRanges: RangeOverride = rangeOverride ?? RANGOS_POR_FRUTA[initialFruit];

  const [fruit, setFruit] = useState<Fruit>(initialFruit);
  const [ranges, setRanges] = useState<RangeOverride>(initialRanges);

  const historico = useMemo(() => getHistorico(tunnelId, 30), [tunnelId]);

  function guardarRangos() {
    onChangeRanges?.(ranges); // notifica si te pasaron callback
  }
  function iniciarProceso() {
    onChangeFruit?.(fruit);   // notifica si te pasaron callback
  }

  const tabs: TabItem[] = [
    {
      key: "temperaturas",
      label: "Temperaturas",
      content: (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card title="Temp. mínima actual">
            <Big>{minOfTunnel(tun)}</Big>
          </Card>
          <Card title="Temp. máxima actual">
            <Big>{maxOfTunnel(tun)}</Big>
          </Card>
          <Card title={`Rango ideal (${fruit})`}>
            <div className="flex items-center gap-2 text-2xl font-bold">
              {ranges.idealMin}°C – {ranges.idealMax}°C
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Alarmas: &lt; {ranges.min}°C o &gt; {ranges.max}°C
            </div>
          </Card>

          {/* Editor de rangos */}
          <div className="lg:col-span-3 rounded-xl border border-slate-700/60 p-4 bg-slate-900/40">
            <div className="font-semibold mb-3">Editar límites y rango ideal</div>
            <div className="grid sm:grid-cols-4 gap-3">
              <NumberBox label="Mín. alarma" value={ranges.min} onChange={v => setRanges(r => ({ ...r, min: v }))} />
              <NumberBox label="Máx. alarma" value={ranges.max} onChange={v => setRanges(r => ({ ...r, max: v }))} />
              <NumberBox label="Ideal desde" value={ranges.idealMin} onChange={v => setRanges(r => ({ ...r, idealMin: v }))} />
              <NumberBox label="Ideal hasta" value={ranges.idealMax} onChange={v => setRanges(r => ({ ...r, idealMax: v }))} />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={guardarRangos} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500">
                Guardar
              </button>
              <span className="text-xs text-slate-400">
                (Sprint 1: local al túnel)
              </span>
            </div>
          </div>

          {/* Ambiente/Retorno */}
          <Card title="Ambiente (Salida)" subtitle="EXTERIOR">
            <Badge value={tun.sensores.AMB_OUT} />
          </Card>
          <Card title="Retorno" subtitle="EXTERIOR">
            <Badge value={tun.sensores.AMB_RET} />
          </Card>
        </div>
      ),
    },
    {
      key: "grafico",
      label: "Gráfico",
      content: (
        <ChartTab
          historico={historico}
          rango={ranges}
          titulo={`Túnel ${tun.id} — ${fruit}`}
        />
      ),
    },
    {
      key: "procesos",
      label: "Procesos",
      content: (
        <ProcesosForm
          frutaActual={fruit}
          frutasDisponibles={availableFruits}
          onChangeFruit={(f) => setFruit(f)}
          onStart={iniciarProceso}
        />
      ),
    },
    {
      key: "historico",
      label: "Histórico",
      content: <Historico historico={historico} tunnelId={tunnelId} />,
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title={`Túnel ${tun.id} — ${fruit}`} maxWidth="max-w-6xl">
      <Tabs items={tabs} initial="temperaturas" />
    </Modal>
  );
}

/* ---------- subcomponentes ---------- */

function Card({ title, children, subtitle }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40">
      <div className="text-sm text-slate-300">{title}</div>
      {subtitle && <div className="text-[11px] text-slate-400">{subtitle}</div>}
      <div className="mt-2">{children}</div>
    </div>
  );
}
function Big({ children }: { children: React.ReactNode }) {
  return <div className="text-4xl font-extrabold">{children}</div>;
}
function NumberBox({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-slate-300">{label}</div>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
      />
    </label>
  );
}
function Badge({ value }: { value: number | "OUT" }) {
  return (
    <span className="inline-block rounded bg-slate-800 text-slate-100 text-xs px-3 py-1">
      {typeof value === "number" ? `${value}°C` : "OUT"}
    </span>
  );
}

function minOfTunnel(t: any) {
  const nums = Object.values(t.sensores).filter(v => typeof v === "number") as number[];
  return `${Math.min(...nums).toFixed(1)}°C`;
}
function maxOfTunnel(t: any) {
  const nums = Object.values(t.sensores).filter(v => typeof v === "number") as number[];
  return `${Math.max(...nums).toFixed(1)}°C`;
}

/* -------- Procesos (mock Sprint 1, fiel al manual) -------- */

function ProcesosForm({
  frutaActual,
  frutasDisponibles,
  onChangeFruit,
  onStart,
}: {
  frutaActual: Fruit;
  frutasDisponibles: Fruit[];
  onChangeFruit: (f: Fruit) => void;
  onStart: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40">
      <div className="font-semibold mb-3">Inicio de Proceso</div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-sm">
            <div className="mb-1 text-slate-300">Fecha inicio</div>
            <input type="datetime-local" className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-slate-300">Mediciones</div>
            <select className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2">
              <option>Cada 15 min</option>
              <option>Cada 5 min</option>
              <option>Cada 1 min</option>
            </select>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-slate-300">Destino</div>
            <input className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-slate-300">Operador inicial</div>
            <input className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-slate-300">Condición inicial</div>
            <textarea className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 h-20" />
          </label>
        </div>

        <div className="grid gap-2">
          <label className="text-sm">
            <div className="mb-1 text-slate-300">Especie (fruta)</div>
            <select
              value={frutaActual}
              onChange={(e) => onChangeFruit(e.target.value as Fruit)}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
            >
              {frutasDisponibles.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-slate-300">Fecha último cambio</div>
            <input disabled className="w-full rounded border border-slate-800 bg-slate-800/60 px-3 py-2" />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-slate-300">Origen</div>
            <input className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-slate-300">Estado</div>
            <input disabled value="Libre" className="w-full rounded border border-slate-800 bg-slate-800/60 px-3 py-2" />
          </label>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onStart} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500">Iniciar</button>
        <button className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600">Cancelar</button>
      </div>
      <div className="text-xs text-slate-400 mt-2">
        (Sprint 1)
      </div>
    </div>
  );
}

/* -------- Histórico (tabla + exportación) -------- */

function Historico({ historico, tunnelId }: { historico: any[]; tunnelId: number }) {
  const areaRef = useRef<HTMLDivElement>(null);

  async function exportPDF() {
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");
      const node = areaRef.current!;
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#0f172a" });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
      pdf.addImage(img, "PNG", x, y, w, h);
      pdf.save(`historico-tunel-${tunnelId}.pdf`);
    } catch (e) {
      console.error(e);
      alert("No se pudo exportar el PDF. ¿Instalaste jspdf y html2canvas?");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Últimas mediciones</div>
        <button onClick={exportPDF} className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500">
          Exportar PDF
        </button>
      </div>

      <div ref={areaRef} className="overflow-x-auto rounded-xl border border-slate-700/60 p-3 bg-slate-900/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-700">
              <th className="py-2">Fecha</th>
              <th className="py-2">AMB OUT</th>
              <th className="py-2">AMB RET</th>
              <th className="py-2">IZQ EXT ENT</th>
              <th className="py-2">IZQ INT ENT</th>
              <th className="py-2">DER INT ENT</th>
              <th className="py-2">DER EXT ENT</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((row) => (
              <tr key={row.ts} className="border-b border-slate-800">
                <td className="py-2">{new Date(row.ts).toLocaleString()}</td>
                <td className="py-2">{fmt(row.AMB_OUT)}</td>
                <td className="py-2">{fmt(row.AMB_RET)}</td>
                <td className="py-2">{fmt(row.IZQ_EXT_ENT ?? row.PULP_1)}</td>
                <td className="py-2">{fmt(row.IZQ_INT_ENT ?? row.PULP_2)}</td>
                <td className="py-2">{fmt(row.DER_INT_ENT ?? row.PULP_3)}</td>
                <td className="py-2">{fmt(row.DER_EXT_ENT ?? row.PULP_4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-400 mt-2">(* Datos simulados, Sprint 1)</div>
    </div>
  );
}

function fmt(v: number | "OUT") { return v === "OUT" ? "OUT" : `${v}°C`; }
