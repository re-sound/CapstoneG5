// src/components/TunnelDetail.tsx
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Modal from "./Modal";
import Tabs, { TabItem } from "./Tabs";
import ChartTab from "./ChartTab";
import {
  TUNELES_MOCK,
  RANGOS_POR_FRUTA,
  getHistorico,
} from "../data/tunnelMock";
import {
  Fruit,
  Range,
  MeasurePlan,
  getProcess,
  subscribe,
  startProcess,
  updateRanges,
  updateProcessInfo,
  pauseProcess,
  resumeProcess,
  finalizeProcess,
} from "../state/processStore";

/* ----------------------------------------------------------------
   Historial de procesos (simple) — localStorage por túnel
------------------------------------------------------------------*/
type HistoryItem = {
  id: string;
  startedAt: string; // ISO
  endedAt: string;   // ISO
  fruit: Fruit;
  ranges: Range;
  endedBy: string;
};
const HISTORY_KEY = (tunnelId: number) => `apt_history_${tunnelId}`;

function loadHistory(tunnelId: number): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY(tunnelId));
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}
function pushHistory(tunnelId: number, item: HistoryItem) {
  const list = loadHistory(tunnelId);
  list.unshift(item); // último primero
  localStorage.setItem(HISTORY_KEY(tunnelId), JSON.stringify(list));
}

/* ----------------------------------------------------------------
   Componente principal (Modal)
------------------------------------------------------------------*/
export default function TunnelDetail({
  tunnelId,
  open,
  onClose,
}: {
  tunnelId: number;
  open: boolean;
  onClose: () => void;
}) {
  const tun = TUNELES_MOCK.find((t) => t.id === tunnelId)!;
  const process = useSyncExternalStore(
    subscribe,
    () => getProcess(tunnelId),
    () => getProcess(tunnelId)
  );
  const historico = useMemo(() => getHistorico(tunnelId, 60), [tunnelId]);

  const tabs: TabItem[] = [
    { key: "temperaturas", label: "Temperaturas", content: <ResumenTemperaturas tunnelId={tunnelId} /> },
    { key: "grafico", label: "Gráfico", content: <ChartTab historico={historico} /> },
    { key: "procesos", label: "Procesos", content: <ProcesosPane tunnelId={tunnelId} /> },
    { key: "historico", label: "Histórico", content: <HistoricoTable historico={historico} tunnelId={tunnelId} /> },
  ];

  return (
    <Modal open={open} onClose={onClose} title={`Túnel ${tun.id} — ${process.fruit}`} maxWidth="max-w-6xl">
      <Tabs items={tabs} initial="temperaturas" />
    </Modal>
  );
}

/* ----------------------------------------------------------------
   Temperaturas (resumen)
------------------------------------------------------------------*/
/* ---------- Temperaturas (resumen) con rangos del proceso ---------- */

function ResumenTemperaturas({ tunnelId }: { tunnelId: number }) {
  const tun = TUNELES_MOCK.find((t) => t.id === tunnelId)!;

  // Traemos el proceso para usar sus rangos actuales
  const process = useSyncExternalStore(
    subscribe,
    () => getProcess(tunnelId),
    () => getProcess(tunnelId)
  );
  const ranges = process.ranges;

  // Helpers de estado
  const nums = Object.values(tun.sensores).filter((v) => typeof v === "number") as number[];
  const min = Math.min(...nums);
  const max = Math.max(...nums);

  const SensorBadge = ({ value, label }: { value: number | "OUT"; label?: string }) => {
    const status = classifyTemp(value, ranges);
    const cls = chipBg(status);
    return (
      <span className={`inline-flex items-center gap-2 rounded text-xs px-3 py-1 text-white ${cls}`}>
        {label && <span className="text-[10px] opacity-85">{label}</span>}
        <span>{typeof value === "number" ? `${value}°C` : "OUT"}</span>
      </span>
    );
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card title="Temp. mínima actual">
        <div className={`inline-block rounded px-3 py-1 text-white ${chipBg(classifyTemp(min, ranges))}`}>
          <Big>{min.toFixed(1)}°C</Big>
        </div>
      </Card>

      <Card title="Temp. máxima actual">
        <div className={`inline-block rounded px-3 py-1 text-white ${chipBg(classifyTemp(max, ranges))}`}>
          <Big>{max.toFixed(1)}°C</Big>
        </div>
      </Card>

      <Card title="Rango ideal (actual)">
        <div className="text-2xl font-bold">
          {ranges.idealMin}°C – {ranges.idealMax}°C
        </div>
        <div className="text-xs mt-1 text-slate-400">
          Alarmas: &lt; {ranges.min}°C o &gt; {ranges.max}°C
        </div>
      </Card>

      <Card title="Ambiente (Salida)" subtitle="EXTERIOR">
        <SensorBadge value={tun.sensores.AMB_OUT} />
      </Card>

      <Card title="Retorno" subtitle="EXTERIOR">
        <SensorBadge value={tun.sensores.AMB_RET} />
      </Card>

      <Card title="Interior — Entrada">
        <div className="flex gap-2 flex-wrap">
          <SensorBadge value={tun.sensores.PULP_2} label="IZQ INT ENT" />
          <SensorBadge value={tun.sensores.PULP_1} label="DER INT ENT" />
        </div>
      </Card>

      <Card title="Exterior — Entrada">
        <div className="flex gap-2 flex-wrap">
          <SensorBadge value={tun.sensores.PULP_3} label="IZQ EXT ENT" />
          <SensorBadge value={tun.sensores.PULP_4} label="DER EXT ENT" />
        </div>
      </Card>
    </div>
  );
}

/* ---------- Helpers de estado visual para temperaturas ---------- */

// Devuelve: "OUT" | "ALARM_BAJA" | "ALARM_ALTA" | "OK" | "FUERA_IDEAL"
function classifyTemp(v: number | "OUT", r: Range) {
  if (v === "OUT") return "OUT" as const;
  if (v < r.min) return "ALARM_BAJA" as const;
  if (v > r.max) return "ALARM_ALTA" as const;
  if (v >= r.idealMin && v <= r.idealMax) return "OK" as const;
  return "FUERA_IDEAL" as const; // dentro de límites pero fuera del ideal
}

// Mapea estado → clases Tailwind
function chipBg(status: ReturnType<typeof classifyTemp>) {
  switch (status) {
    case "OUT":
      return "bg-slate-600";
    case "ALARM_BAJA":
    case "ALARM_ALTA":
      return "bg-rose-600";
    case "OK":
      return "bg-emerald-600";
    case "FUERA_IDEAL":
    default:
      return "bg-amber-600";
  }
}


/* ----------------------------------------------------------------
   Procesos — iniciar/pausar/continuar/guardar/finalizar + historial
------------------------------------------------------------------*/
function ProcesosPane({ tunnelId }: { tunnelId: number }) {
  const process = useSyncExternalStore(
    subscribe,
    () => getProcess(tunnelId),
    () => getProcess(tunnelId)
  );

  // formularios
  const [fruit, setFruit] = useState<Fruit>(process.fruit);
  const [ranges, setRanges] = useState<Range>(process.ranges);
  const [startedAt, setStartedAt] = useState<string>(process.startedAt ?? new Date().toISOString().slice(0,16));
  const [measurePlan, setMeasurePlan] = useState<MeasurePlan>(process.measurePlan ?? 15);
  const [destination, setDestination] = useState(process.destination ?? "");
  const [startedBy, setStartedBy] = useState(process.startedBy ?? "");
  const [conditionInitial, setConditionInitial] = useState(process.conditionInitial ?? "");
  const [origin, setOrigin] = useState(process.origin ?? "");
  const [endedBy, setEndedBy] = useState("");

  // historial (finalizados)
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory(tunnelId));
  const [showHist, setShowHist] = useState(false);

  // sync si cambia el proceso externamente (sin efectos infinitos)
  const prev = useRef(process);
  if (prev.current !== process) {
    prev.current = process;
    setFruit(process.fruit);
    setRanges(process.ranges);
    setStartedAt(process.startedAt ?? new Date().toISOString().slice(0,16));
    setMeasurePlan(process.measurePlan ?? 15);
    setDestination(process.destination ?? "");
    setStartedBy(process.startedBy ?? "");
    setConditionInitial(process.conditionInitial ?? "");
    setOrigin(process.origin ?? "");
  }

  const defOf = (f: Fruit) => RANGOS_POR_FRUTA[f];

  const statusPill = (
    <span className={`inline-block text-xs px-2 py-1 rounded ${process.status === "running"
      ? "bg-emerald-600 text-white"
      : process.status === "paused"
      ? "bg-amber-600 text-white"
      : process.status === "finished"
      ? "bg-slate-600 text-white"
      : "bg-slate-700 text-slate-100"}`}>
      {process.status === "idle" && "Sin proceso"}
      {process.status === "running" && "En ejecución"}
      {process.status === "paused" && "Pausado"}
      {process.status === "finished" && "Finalizado"}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Estado */}
      <div className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Estado del proceso</div>
          <div className="flex items-center gap-2">
            {statusPill}
            <button
              onClick={() => setShowHist(true)}
              className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
            >
              Ver historial finalizados
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <Info label="Fruta">{process.fruit}</Info>
          <Info label="Plan de mediciones">{(process.measurePlan ?? 15)} min</Info>
          <Info label="Inicio">{process.startedAt ? new Date(process.startedAt).toLocaleString() : "—"}</Info>
          <Info label="Último cambio">{process.lastChangeAt ? new Date(process.lastChangeAt).toLocaleString() : "—"}</Info>
          <Info label="Operador inicial">{process.startedBy ?? "—"}</Info>
          <Info label="Destino">{process.destination ?? "—"}</Info>
          <Info label="Origen">{process.origin ?? "—"}</Info>
          <Info label="Condición inicial">{process.conditionInitial ?? "—"}</Info>
          {process.status === "finished" && (
            <>
              <Info label="Finalizado por">{process.endedBy ?? "—"}</Info>
              <Info label="Finalizado">{process.endedAt ? new Date(process.endedAt).toLocaleString() : "—"}</Info>
            </>
          )}
        </div>
      </div>

      {/* Formulario: iniciar o actualizar */}
      <div className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40 space-y-4">
        <div className="font-semibold">{process.status === "idle" ? "Inicio de Proceso" : "Ajustes del Proceso"}</div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Columna izquierda */}
          <div className="grid gap-3">
            <Field label="Especie (fruta)">
              <select
                value={fruit}
                onChange={(e) => {
                  const f = e.target.value as Fruit;
                  setFruit(f);
                  const def = defOf(f);
                  setRanges({ min: def.min, max: def.max, idealMin: def.idealMin, idealMax: def.idealMax });
                }}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              >
                {Object.keys(RANGOS_POR_FRUTA).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>

            <div className="rounded-lg border border-slate-700/60 p-3 bg-slate-900/30">
              <div className="font-medium mb-2">Rangos (alarmas e ideal)</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <NumberBox label="Mín. alarma" value={ranges.min} onChange={(v) => setRanges({ ...ranges, min: v })} />
                <NumberBox label="Máx. alarma" value={ranges.max} onChange={(v) => setRanges({ ...ranges, max: v })} />
                <NumberBox label="Ideal desde" value={ranges.idealMin} onChange={(v) => setRanges({ ...ranges, idealMin: v })} />
                <NumberBox label="Ideal hasta" value={ranges.idealMax} onChange={(v) => setRanges({ ...ranges, idealMax: v })} />
              </div>
              <div className="text-xs text-slate-400 mt-2">
                Al cambiar la fruta se restablecen los rangos por defecto de esa especie.
              </div>
            </div>
          </div>

          {/* Columna derecha (campos “clásicos”) */}
          <div className="grid gap-3">
            <Field label="Fecha inicio">
              <input
                type="datetime-local"
                value={toLocalInputValue(startedAt)}
                onChange={(e) => setStartedAt(fromLocalInputValue(e.target.value))}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              />
            </Field>

            <Field label="Mediciones">
              <select
                value={measurePlan}
                onChange={(e) => setMeasurePlan(Number(e.target.value) as MeasurePlan)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              >
                <option value={15}>Cada 15 min</option>
                <option value={5}>Cada 5 min</option>
                <option value={1}>Cada 1 min</option>
              </select>
            </Field>

            <Field label="Destino">
              <input value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
            </Field>

            <Field label="Operador inicial">
              <input value={startedBy} onChange={(e) => setStartedBy(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
            </Field>

            <Field label="Condición inicial">
              <textarea value={conditionInitial} onChange={(e) => setConditionInitial(e.target.value)} className="w-full h-20 rounded border border-slate-700 bg-slate-900 px-3 py-2" />
            </Field>

            <Field label="Origen">
              <input value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
            </Field>

            <Field label="Estado">
              <input disabled value={process.status === "idle" ? "Libre" : "Ocupado"} className="w-full rounded border border-slate-800 bg-slate-800/60 px-3 py-2" />
            </Field>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          {process.status === "idle" && (
            <button
              onClick={() =>
                startProcess(tunnelId, {
                  fruit,
                  ranges,
                  startedAt,
                  startedBy: startedBy || "Operador",
                  measurePlan,
                  destination,
                  conditionInitial,
                  origin,
                })
              }
              className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
            >
              Iniciar proceso
            </button>
          )}

          {process.status === "running" && (
            <>
              <button onClick={() => pauseProcess(tunnelId)} className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-500">Pausar</button>
              <button
                onClick={() => {
                  updateRanges(tunnelId, ranges);
                  updateProcessInfo(tunnelId, { startedAt, startedBy, measurePlan, destination, conditionInitial, origin });
                }}
                className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500"
              >
                Guardar cambios
              </button>
            </>
          )}

          {process.status === "paused" && (
            <>
              <button onClick={() => resumeProcess(tunnelId)} className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500">Continuar</button>
              <button
                onClick={() => {
                  updateRanges(tunnelId, ranges);
                  updateProcessInfo(tunnelId, { startedAt, startedBy, measurePlan, destination, conditionInitial, origin });
                }}
                className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500"
              >
                Guardar cambios
              </button>
            </>
          )}
        </div>

        {(process.status === "running" || process.status === "paused") && (
          <div className="rounded-xl border border-slate-700/60 p-3 bg-slate-900/30">
            <div className="font-medium mb-2">Finalizar proceso</div>
            <div className="flex flex-wrap gap-2 items-end">
              <Field label="Finalizado por">
                <input
                  value={endedBy}
                  onChange={(e) => setEndedBy(e.target.value)}
                  placeholder="Nombre del operador"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                />
              </Field>
              <button
                onClick={() => {
                  if (!endedBy.trim()) {
                    alert("Ingresa quién finaliza el proceso.");
                    return;
                  }
                  // 1) snapshot inmediato al historial
                  const endedAtNow = new Date().toISOString();
                  pushHistory(tunnelId, {
                    id: `${tunnelId}-${endedAtNow}`,
                    startedAt: process.startedAt ?? endedAtNow,
                    endedAt: endedAtNow,
                    fruit: process.fruit,
                    ranges: process.ranges,
                    endedBy: endedBy.trim(),
                  });
                  setHistory(loadHistory(tunnelId));
                  // 2) finalizar en el store
                  finalizeProcess(tunnelId, endedBy.trim());
                  setEndedBy("");
                }}
                className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500"
              >
                Finalizar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de historial finalizados */}
      {showHist && (
        <Modal open={showHist} onClose={() => setShowHist(false)} title={`Historial de procesos — Túnel ${tunnelId}`} maxWidth="max-w-4xl">
          {history.length === 0 ? (
            <div className="text-sm text-slate-300">No hay procesos finalizados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="py-2">Inicio</th>
                    <th className="py-2">Fin</th>
                    <th className="py-2">Fruta</th>
                    <th className="py-2">Rango ideal</th>
                    <th className="py-2">Alarmas</th>
                    <th className="py-2">Finalizado por</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-slate-800">
                      <td className="py-2">{new Date(h.startedAt).toLocaleString()}</td>
                      <td className="py-2">{new Date(h.endedAt).toLocaleString()}</td>
                      <td className="py-2">{h.fruit}</td>
                      <td className="py-2">{h.ranges.idealMin}°C – {h.ranges.idealMax}°C</td>
                      <td className="py-2">&lt; {h.ranges.min}°C o &gt; {h.ranges.max}°C</td>
                      <td className="py-2">{h.endedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------
   Histórico de mediciones (tabla + export PDF)
------------------------------------------------------------------*/
function HistoricoTable({ historico, tunnelId }: { historico: any[]; tunnelId: number }) {
  const areaRef = useRef<HTMLDivElement>(null);

  async function exportPDF() {
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(areaRef.current!, { scale: 2, backgroundColor: "#0b1220" });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(img, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
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
        <button onClick={exportPDF} className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500">Exportar PDF</button>
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
                <td className="py-2">{fmt(row.IZQ_EXT_ENT ?? row.PULP_3)}</td>
                <td className="py-2">{fmt(row.IZQ_INT_ENT ?? row.PULP_2)}</td>
                <td className="py-2">{fmt(row.DER_INT_ENT ?? row.PULP_1)}</td>
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

/* ----------------------------------------------------------------
   UI helpers
------------------------------------------------------------------*/
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm block">
      <div className="mb-1 text-slate-300">{label}</div>
      {children}
    </label>
  );
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
function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="text-slate-200 break-words">{children}</div>
    </div>
  );
}
function Badge({ value, label }: { value: number | "OUT"; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded bg-slate-800 text-slate-100 text-xs px-3 py-1">
      {label && <span className="text-[10px] text-slate-300">{label}</span>}
      <span>{typeof value === "number" ? `${value}°C` : "OUT"}</span>
    </span>
  );
}
function fmt(v: number | "OUT") { return v === "OUT" ? "OUT" : `${v}°C`; }

// helpers para datetime-local ↔ ISO
function toLocalInputValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInputValue(v: string) {
  return new Date(v).toISOString();
}
