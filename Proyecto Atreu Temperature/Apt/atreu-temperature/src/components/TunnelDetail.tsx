// src/components/TunnelDetail.tsx
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Modal from "./Modal";
import Tabs, { type TabItem } from "./Tabs";
import ChartTab from "./ChartTab";
import { jsPDF } from "jspdf";
import { useAuth } from "../context/AuthContext";
import {
  TUNELES_MOCK,
  RANGOS_POR_FRUTA,
} from "../data/tunnelMock";
import {
  type Fruit,
  type Range,
  type MeasurePlan,
  type TunnelProcess,
  getProcess,
  subscribe,
  updateRanges,
  updateProcessInfo,
  pauseProcess,
  resumeProcess,
} from "../state/processStore";
import { apiStartProcess, apiFinalizeProcess, apiPauseProcess, apiResumeProcess, type HistoryRow } from "../api/client";
import * as processStore from "../state/processStore";
import { useHistoryData } from "../hooks/useHistoryData";

/* ----------------------------------------------------------------
   Objetos por defecto estables para evitar bucles infinitos
------------------------------------------------------------------*/
const defaultProcessCache = new Map<number, TunnelProcess>();

const getDefaultProcess = (tunnelId: number): TunnelProcess => {
  if (!defaultProcessCache.has(tunnelId)) {
    defaultProcessCache.set(tunnelId, {
      tunnelId,
      status: "idle" as const,
      fruit: "GENÉRICA" as const,
      ranges: { min: 0, max: 10, idealMin: 2, idealMax: 8 }
    });
  }
  return defaultProcessCache.get(tunnelId)!;
};

/* ----------------------------------------------------------------
   Historial de procesos  — localStorage por túnel
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
   Eventos de acciones de proceso — localStorage por túnel
   (pausas, reanudaciones, finalizaciones con operador y hora)
------------------------------------------------------------------*/
type ActionEvent = {
  id: string;
  type: "paused" | "resumed" | "finalized";
  by: string;
  at: string; // ISO
  note?: string;
};
const EVENTS_KEY = (tunnelId: number) => `apt_events_${tunnelId}`;

function loadEvents(tunnelId: number): ActionEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY(tunnelId));
    if (!raw) return [];
    return JSON.parse(raw) as ActionEvent[];
  } catch {
    return [];
  }
}
function pushEvent(tunnelId: number, ev: ActionEvent) {
  const list = loadEvents(tunnelId);
  list.unshift(ev); // último primero
  localStorage.setItem(EVENTS_KEY(tunnelId), JSON.stringify(list));
}

/* ----------------------------------------------------------------
   Funciones para manejar procesos con el backend
------------------------------------------------------------------*/
const startProcessAction = async (
  tunnelId: number,
  payload: {
    fruit: Fruit;
    ranges: Range;
    startedBy?: string;
    startedAt?: string;
    measurePlan?: MeasurePlan;
    destination?: string;
    conditionInitial?: string;
    origin?: string;
    description?: string;
  }
) => {
  console.log('🔄 Iniciando proceso en backend...', { tunnelId, payload });

  try {
    // Llamar a la API del backend
    const result = await apiStartProcess(tunnelId, {
      fruit: payload.fruit,
      min_temp: payload.ranges.min,
      max_temp: payload.ranges.max,
      ideal_min: payload.ranges.idealMin,
      ideal_max: payload.ranges.idealMax,
      measure_plan: payload.measurePlan,
      destination: payload.destination,
      origin: payload.origin,

      condition_initial: payload.conditionInitial,
      description: payload.description
    });

    console.log('✅ Proceso iniciado en backend:', result);

    // Actualizar el store local
    processStore.startProcess(tunnelId, payload);

  } catch (error) {
    console.error('❌ Error iniciando proceso:', error);
    throw error;
  }
};

const finalizeProcessAction = async (tunnelId: number, endedBy: string) => {
  console.log('🏁 Finalizando proceso en backend...', { tunnelId, endedBy });

  try {
    // Llamar a la API del backend
    const result = await apiFinalizeProcess(tunnelId, endedBy);

    console.log('✅ Proceso finalizado en backend:', result);

    // Actualizar el store local
    processStore.finalizeProcess(tunnelId, endedBy);

  } catch (error) {
    console.error('❌ Error finalizando proceso:', error);
    throw error;
  }
};

// Pausar proceso: backend + store local
const pauseProcessAction = async (tunnelId: number) => {
  console.log('⏸️ Pausando proceso en backend...', { tunnelId });
  try {
    const result = await apiPauseProcess(tunnelId);
    console.log('✅ Proceso pausado en backend:', result);
    processStore.pauseProcess(tunnelId);
  } catch (error) {
    console.error('❌ Error pausando proceso:', error);
    throw error;
  }
};

// Reanudar proceso: backend + store local
const resumeProcessAction = async (tunnelId: number) => {
  console.log('▶️ Reanudando proceso en backend...', { tunnelId });
  try {
    const result = await apiResumeProcess(tunnelId);
    console.log('✅ Proceso reanudado en backend:', result);
    processStore.resumeProcess(tunnelId);
  } catch (error) {
    console.error('❌ Error reanudando proceso:', error);
    throw error;
  }
};

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
    () => getProcess(tunnelId) || getDefaultProcess(tunnelId),
    () => getProcess(tunnelId) || getDefaultProcess(tunnelId)
  ) as TunnelProcess; // Aserción de tipo para evitar null

  // Histórico con auto-refresh (cada 20s) - todos los datos históricos
  const { data: historico = [], loading: histLoading, error: histError } =
    useHistoryData(tunnelId, 240, 20_000); // 4 horas de datos

  const tabs: TabItem[] = [
    { key: "temperaturas", label: "Temperaturas", content: <ResumenTemperaturas tunnelId={tunnelId} historico={historico} /> },
    {
      key: "grafico", label: "Gráfico", content: histLoading
        ? <div className="text-slate-400 text-sm p-2">Cargando…</div>
        : histError
          ? <div className="text-rose-400 text-sm p-2">Error: {histError.message}</div>
          : <ChartTab historico={historico} />
    },
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
   Temperaturas (resumen) — usa el último registro del histórico real
------------------------------------------------------------------*/

function ResumenTemperaturas({ tunnelId, historico }: { tunnelId: number; historico: HistoryRow[] }) {
  const process = useSyncExternalStore(
    subscribe,
    () => getProcess(tunnelId) || getDefaultProcess(tunnelId),
    () => getProcess(tunnelId) || getDefaultProcess(tunnelId)
  ) as TunnelProcess; // Aserción de tipo para evitar null
  const ranges = process.ranges;

  // Última muestra del backend (fallback a mock si aún no llega)
  const last = historico.length ? historico[historico.length - 1] : null;
  const sensores = last ? {
    AMB_OUT: last.AMB_OUT,
    AMB_RET: last.AMB_RET,
    PULP_1: last.PULP_1,
    PULP_2: last.PULP_2,
    PULP_3: last.PULP_3,
    PULP_4: last.PULP_4,
  } : TUNELES_MOCK.find(t => t.id === tunnelId)!.sensores;

  const nums = Object.values(sensores).filter((v) => typeof v === "number") as number[];
  const min = nums.length ? Math.min(...nums) : NaN;
  const max = nums.length ? Math.max(...nums) : NaN;

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
        <div className={`inline-block rounded px-3 py-1 text-white ${chipBg(classifyTemp(min as any, ranges))}`}>
          <Big>{isFinite(min) ? `${min.toFixed(1)}°C` : "—"}</Big>
        </div>
      </Card>

      <Card title="Temp. máxima actual">
        <div className={`inline-block rounded px-3 py-1 text-white ${chipBg(classifyTemp(max as any, ranges))}`}>
          <Big>{isFinite(max) ? `${max.toFixed(1)}°C` : "—"}</Big>
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
        <SensorBadge value={sensores.AMB_OUT} />
      </Card>

      <Card title="Retorno" subtitle="EXTERIOR">
        <SensorBadge value={sensores.AMB_RET} />
      </Card>

      <Card title="Interior — Entrada">
        <div className="flex gap-2 flex-wrap">
          <SensorBadge value={sensores.PULP_2} label="IZQ INT ENT" />
          <SensorBadge value={sensores.PULP_1} label="DER INT ENT" />
        </div>
      </Card>

      <Card title="Exterior — Entrada">
        <div className="flex gap-2 flex-wrap">
          <SensorBadge value={sensores.PULP_3} label="IZQ EXT ENT" />
          <SensorBadge value={sensores.PULP_4} label="DER EXT ENT" />
        </div>
      </Card>
    </div>
  );
}

/* ---------- Helpers de estado visual para temperaturas ---------- */

// Devuelve: "OUT" | "ALARM_BAJA" | "ALARM_ALTA" | "OK" | "FUERA_IDEAL"
function classifyTemp(v: number | "OUT", r: Range) {
  if (v === "OUT" || Number.isNaN(v)) return "OUT" as const;
  if (v < r.min) return "ALARM_BAJA" as const;
  if (v > r.max) return "ALARM_ALTA" as const;
  if (v >= r.idealMin && v <= r.idealMax) return "OK" as const;
  return "FUERA_IDEAL" as const;
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
  const { user } = useAuth();
  const [formContraido, setFormContraido] = useState(false);
  // const [isChecked, setIsChecked] = useState(false); // No se usa actualmente

  // 🔹 Estado inicial: un objeto que guarda el estado por sensor
  const [sensorSettings, setSensorSettings] = useState<
    Record<
      string,
      { enabled: boolean; ranges: { min: number; max: number; valNuev: number } }
    >
  >({});

  // 🔹 Efecto para inicializar los sensores al cargar el componente
  useEffect(() => {
    const sensores = TUNELES_MOCK.find((t) => t.id === tunnelId)?.sensores || {};
    const initialSettings: Record<
      string,
      { enabled: boolean; ranges: { min: number; max: number; valNuev: number } }
    > = {};

    Object.keys(sensores).forEach((nombre) => {
      initialSettings[nombre] = {
        enabled: false,
        ranges: { min: 0, max: 0, valNuev: 0 },
      };
    });

    setSensorSettings(initialSettings);
  }, [tunnelId]);

  // 🔹 Funciones auxiliares
  const handleToggle = (nombre: string, checked: boolean) => {
    setSensorSettings((prev) => ({
      ...prev,
      [nombre]: { ...prev[nombre], enabled: checked },
    }));
  };

  const handleRangeChange = (nombre: string, field: "min" | "max" | "valNuev", value: number) => {
    setSensorSettings((prev) => ({
      ...prev,
      [nombre]: {
        ...prev[nombre],
        ranges: { ...prev[nombre].ranges, [field]: value },
      },
    }));
  };

  const process = useSyncExternalStore(
    subscribe,
    () => getProcess(tunnelId) || getDefaultProcess(tunnelId),
    () => getProcess(tunnelId) || getDefaultProcess(tunnelId)
  ) as TunnelProcess; // Aserción de tipo para evitar null

  useEffect(() => {
    // Mantener formulario contraído solo cuando está en ejecución.
    // En pausa queremos mostrar los botones completos (incluye "Continuar").
    if (process.status === "running") {
      setFormContraido(true);
    } else {
      setFormContraido(false);
    }
  }, [process.status]);
  // formularios
  const [fruit, setFruit] = useState<Fruit>(process.fruit);
  const [ranges, setRanges] = useState<Range>(process.ranges);
  const [startedAt, setStartedAt] = useState<string>(process.startedAt ?? new Date().toISOString().slice(0, 16));
  const [measurePlan, setMeasurePlan] = useState<MeasurePlan>(process.measurePlan ?? 15);
  const [destination, setDestination] = useState(process.destination ?? "");
  const [startedBy, setStartedBy] = useState(process.startedBy ?? "");
  // const [conditionFinal, setConditionFinal] = useState(""); // No se usa actualmente
  const [conditionInitial, setConditionInitial] = useState(process.conditionInitial ?? "");
  const [origin, setOrigin] = useState(process.origin ?? "");
  const [endedBy, setEndedBy] = useState("");

  // historial (finalizados)
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory(tunnelId));
  const [showHist, setShowHist] = useState(false);
  // eventos (pausas/reanudaciones/finalizados)
  const [events, setEvents] = useState<ActionEvent[]>(() => loadEvents(tunnelId));
  const [actionBy, setActionBy] = useState<string>(() => (user?.full_name || user?.user_id || process.startedBy || "").trim());
  // Observaciones para pausa y reanudación
  const [pauseNote, setPauseNote] = useState<string>("");
  const [resumeNote, setResumeNote] = useState<string>("");

  // sync si cambia el proceso externamente (sin efectos infinitos)
  const prev = useRef(process);
  if (prev.current !== process) {
    prev.current = process;
    setFruit(process.fruit);
    setRanges(process.ranges);
    setStartedAt(process.startedAt ?? new Date().toISOString().slice(0, 16));
    setMeasurePlan(process.measurePlan ?? 15);
    setDestination(process.destination ?? "");
    setStartedBy(process.startedBy ?? "");
    setConditionInitial(process.conditionInitial ?? "");
    setOrigin(process.origin ?? "");
  }

  const defOf = (f: Fruit) => RANGOS_POR_FRUTA[f];

  const statusPill = (
    <span className={`inline-block text-xs px-2 py-1 rounded ${process.status === "running"
      ? "bg-red-500 text-white"
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

  // Últimos eventos de pausa/reanudación para mostrar operador y hora
  const lastPaused = events.find((ev) => ev.type === "paused");
  const lastResumed = events.find((ev) => ev.type === "resumed");

  return (
    <div className="space-y-4 px-4 pb-4">
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
          
          {process.status === "paused" && process.pausedAt && (
            <Info label="⏸️ Pausado">
              <span className="text-amber-400">{new Date(process.pausedAt).toLocaleString()}</span>
              {lastPaused?.by && (
                <span className="ml-2 text-slate-300">por {lastPaused.by}</span>
              )}
            </Info>
          )}

          {process.status === "running" && process.resumedAt && (
            <Info label="▶️ Reanudado">
              <span className="text-green-400">{new Date(process.resumedAt).toLocaleString()}</span>
              {lastResumed?.by && (
                <span className="ml-2 text-slate-300">por {lastResumed.by}</span>
              )}
            </Info>
          )}
          
          {process.status === "finished" && (
            <>
              <Info label="Finalizado por">{process.endedBy ?? "—"}</Info>
              <Info label="🏁 Finalizado">{process.finalizedAt ? new Date(process.finalizedAt).toLocaleString() : (process.endedAt ? new Date(process.endedAt).toLocaleString() : "—")}</Info>
            </>
          )}
        </div>
      </div>

      {/* Formulario: iniciar o actualizar */}

      {!formContraido && (
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
                <div className="font-medium mb-2">Listado de sensores</div>
                <table className="w-full text-sm text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-200">
                      <th className="py-2 px-3 text-left">Nombre</th>
                      <th className="py-2 px-3 text-center">Valor actual</th>
                      <th className="py-2 px-3 text-center">Habilitado</th>
                      <th className="py-2 px-3 text-center">Mín. alarma</th>
                      <th className="py-2 px-3 text-center">Máx. alarma</th>
                      <th className="py-2 px-3 text-center">Valor nuevo</th>
                    </tr>
                  </thead>

                  <tbody>
                    {Object.entries(
                      TUNELES_MOCK.find((t) => t.id === tunnelId)?.sensores || {}
                    ).map(([nombre, valor]) => {
                      const settings = sensorSettings[nombre] || {
                        enabled: false,
                        ranges: { min: 0, max: 0, valNuev: 0 },
                      };

                      return (
                        <tr
                          key={nombre}
                          className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                        >
                          <td className="py-2 px-3 font-medium text-slate-200">
                            {nombre.replace(/_/g, " ")}
                          </td>

                          <td className="py-2 px-3 text-center">
                            {typeof valor === "number" ? `${valor.toFixed(1)}°C` : "—"}
                          </td>

                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={settings.enabled}
                              onChange={(e) => handleToggle(nombre, e.target.checked)}
                              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                            />
                          </td>

                          <td className="py-2 px-3 text-center">
                            <NumberBox
                              label=""
                              value={settings.ranges.min}
                              onChange={(v) => handleRangeChange(nombre, "min", v)}
                            />
                          </td>

                          <td className="py-2 px-3 text-center">
                            <NumberBox
                              label=""
                              value={settings.ranges.max}
                              onChange={(v) => handleRangeChange(nombre, "max", v)}
                            />
                          </td>

                          <td className="py-2 px-3 text-center">
                            <NumberBox
                              label=""
                              value={settings.ranges.valNuev}
                              onChange={(v) => handleRangeChange(nombre, "valNuev", v)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
          <div className="flex flex-wrap gap-2 items-end">
            {(process.status === "running" || process.status === "paused" || process.status === "idle") && (
              <Field label="Operador de acción">
                <input
                  value={actionBy}
                  onChange={(e) => setActionBy(e.target.value)}
                  placeholder="Nombre del operador"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                />
              </Field>
            )}
            {process.status === "idle" && (
              <button
                onClick={async () => {
                  try {
                    await startProcessAction(tunnelId, {
                      fruit,
                      ranges,
                      startedAt,
                      startedBy: startedBy || actionBy || "Operador",
                      measurePlan,
                      destination,
                      conditionInitial,
                      origin,
                      description: `Proceso iniciado por ${startedBy || "Operador"}`
                    });
                    console.log("✅ Proceso iniciado exitosamente");
                    setFormContraido(true);
                  } catch (error) {
                    console.error("❌ Error iniciando proceso:", error);
                    alert("Error al iniciar el proceso. Revisa la consola para más detalles.");
                  }
                }}
                className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
              >
                Iniciar proceso
              </button>
            )}

            {process.status === "running" && (
              <>
                <Field label="Observación de pausa">
                  <textarea
                    value={pauseNote}
                    onChange={(e) => setPauseNote(e.target.value)}
                    className="w-full h-20 rounded border border-slate-700 bg-slate-900 px-3 py-2"
                    placeholder="Motivo o notas de la pausa..."
                  />
                </Field>
                <button
                  onClick={async () => {
                    if (!actionBy.trim()) {
                      alert("Ingresa el operador que realiza la pausa.");
                      return;
                    }
                    try {
                      await pauseProcessAction(tunnelId);
                      const now = new Date().toISOString();
                      pushEvent(tunnelId, {
                        id: `${tunnelId}-paused-${now}`,
                        type: "paused",
                        by: actionBy.trim(),
                        at: now,
                        note: pauseNote || undefined,
                      });
                      setEvents(loadEvents(tunnelId));
                      setPauseNote("");
                      console.log("✅ Proceso pausado exitosamente");
                    } catch (error) {
                      alert("Error al pausar el proceso. Revisa la consola para más detalles.");
                    }
                  }}
                  className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-500"
                >
                  Pausar
                </button>
                <button
                  onClick={() => {
                    updateRanges(tunnelId, ranges);
                    updateProcessInfo(tunnelId, { fruit, startedAt, startedBy, measurePlan, destination, conditionInitial, origin });
                    setFormContraido(true);
                  }}
                  className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500"
                >
                  Guardar cambios
                </button>
              </>
            )}

            {process.status === "paused" && (
              <>
                <Field label="Observación de reanudación">
                  <textarea
                    value={resumeNote}
                    onChange={(e) => setResumeNote(e.target.value)}
                    className="w-full h-20 rounded border border-slate-700 bg-slate-900 px-3 py-2"
                    placeholder="Notas relacionadas con la reanudación..."
                  />
                </Field>
                <button
                  onClick={async () => {
                    if (!actionBy.trim()) {
                      alert("Ingresa el operador que reanuda el proceso.");
                      return;
                    }
                    try {
                      await resumeProcessAction(tunnelId);
                      const now = new Date().toISOString();
                      pushEvent(tunnelId, {
                        id: `${tunnelId}-resumed-${now}`,
                        type: "resumed",
                        by: actionBy.trim(),
                        at: now,
                        note: resumeNote || undefined,
                      });
                      setEvents(loadEvents(tunnelId));
                      setResumeNote("");
                      console.log("✅ Proceso reanudado exitosamente");
                      setFormContraido(true);
                    } catch (error) {
                      alert("Error al reanudar el proceso. Revisa la consola para más detalles.");
                    }
                  }}
                  className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500"
                >
                  Continuar
                </button>
                <button
                  onClick={() => {
                    updateRanges(tunnelId, ranges);
                    updateProcessInfo(tunnelId, { fruit, startedAt, startedBy, measurePlan, destination, conditionInitial, origin });
                    setFormContraido(true);
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
                <Field label="Observación Final">
                  <textarea value={conditionInitial} onChange={(e) => setConditionInitial(e.target.value)} className="w-full h-20 rounded border border-slate-700 bg-slate-900 px-3 py-2" placeholder="Notas sobre el estado final del proceso..." />
                </Field>
                <Field label="Finalizado por">
                  <input
                    value={endedBy}
                    onChange={(e) => setEndedBy(e.target.value)}
                    placeholder="Nombre del operador"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                  />
                </Field>
                <button
                  onClick={async () => {
                    if (!endedBy.trim()) {
                      alert("Ingresa quién finaliza el proceso.");
                      return;
                    }

                    try {
                      // Finaliza en el backend y store
                      await finalizeProcessAction(tunnelId, endedBy.trim());

                      // Actualizar historial local
                      const endedAtNow = new Date().toISOString();
                      pushHistory(tunnelId, {
                        id: `${tunnelId}-${endedAtNow}`,
                        startedAt: process.startedAt ?? endedAtNow,
                        endedAt: endedAtNow,
                        fruit: process.fruit,
                        ranges: process.ranges,
                        endedBy: endedBy.trim(),
                      });

                      // refresca vista
                      setHistory(loadHistory(tunnelId));
                      // Registrar evento de finalización
                      pushEvent(tunnelId, {
                        id: `${tunnelId}-finalized-${endedAtNow}`,
                        type: "finalized",
                        by: endedBy.trim(),
                        at: endedAtNow,
                        note: conditionInitial || undefined,
                      });
                      setEvents(loadEvents(tunnelId));
                      setEndedBy("");

                      console.log("✅ Proceso finalizado exitosamente");
                    } catch (error) {
                      console.error("❌ Error finalizando proceso:", error);
                      alert("Error al finalizar el proceso. Revisa la consola para más detalles.");
                    }
                  }}
                  className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500"
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {formContraido && process.status === "running" && (
        <div className="flex gap-2">
          <button
            onClick={() => setFormContraido(false)}
            className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500"
          >
            Modificar proceso
          </button>
          <button
            onClick={() => {
              // puedes reutilizar la lógica del botón de finalizar que ya tienes
              const name = prompt("¿Quién finaliza el proceso?");
              if (name) finalizeProcessAction(tunnelId, name);
            }}
            className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500"
          >
            Finalizar proceso
          </button>
        </div>
      )}

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
              {/* Eventos de proceso */}
              <div className="mt-6">
                <div className="font-semibold mb-2">Eventos del proceso</div>
                {events.length === 0 ? (
                  <div className="text-sm text-slate-300">Sin eventos registrados.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-700">
                        <th className="py-2">Acción</th>
                        <th className="py-2">Operador</th>
                        <th className="py-2">Fecha y hora</th>
                        <th className="py-2">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => (
                        <tr key={ev.id} className="border-b border-slate-800">
                          <td className="py-2">
                            {ev.type === "paused" && "Pausa"}
                            {ev.type === "resumed" && "Reanudación"}
                            {ev.type === "finalized" && "Finalización"}
                          </td>
                          <td className="py-2">{ev.by}</td>
                          <td className="py-2">{new Date(ev.at).toLocaleString()}</td>
                          <td className="py-2">{ev.note ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
function HistoricoTable({ historico, tunnelId }: { historico: HistoryRow[]; tunnelId: number }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [events, setEvents] = useState<ActionEvent[]>(() => loadEvents(tunnelId));

  // Exportar a Excel (CSV compatible con Excel)
  function exportExcel() {
    try {
      const headers = ['Fecha','AMB OUT','AMB RET','IZQ EXT','IZQ INT','DER INT','DER EXT'];
      const rows = historico.map(row => [
        new Date(row.ts).toLocaleString('es-ES'),
        fmt(row.AMB_OUT),
        fmt(row.AMB_RET),
        fmt(row.IZQ_EXT_ENT ?? row.PULP_3),
        fmt(row.IZQ_INT_ENT ?? row.PULP_2),
        fmt(row.DER_INT_ENT ?? row.PULP_1),
        fmt(row.DER_EXT_ENT ?? row.PULP_4)
      ]);

      // Construir CSV (separador coma, escapar comillas)
      const escape = (v: string) => '"' + (v ?? '').replace(/"/g, '""') + '"';
      const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(v => escape(String(v))).join(','))].join('\n');

      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico-tunel-${tunnelId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error al exportar Excel:', e);
      alert(`Error al exportar Excel: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    }
  }

  async function exportPDF() {
    if (isExporting) return; // Evitar múltiples clics

    setIsExporting(true);
    try {
      // Verificar que el elemento existe
      if (!areaRef.current) {
        throw new Error("No se pudo encontrar la tabla para exportar");
      }

      // Crear un PDF con header y contenido estructurado
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Header del PDF
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(94, 163, 16); // Verde La Hornilla
      pdf.text("Reporte de Histórico de Temperaturas", 20, 20);

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Túnel ${tunnelId}`, 20, 30);

      // Información del rango de datos
      if (historico.length > 0) {
        const firstDate = new Date(historico[historico.length - 1].ts);
        const lastDate = new Date(historico[0].ts);
        const rangeStr = `${firstDate.toLocaleDateString('es-ES')} ${firstDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${lastDate.toLocaleDateString('es-ES')} ${lastDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Período: ${rangeStr}`, 20, 40);
        pdf.text(`Total de registros: ${historico.length}`, 20, 47);
      }

      // Fecha de generación
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Generado el: ${dateStr}`, 20, 54);

      // Línea separadora
      pdf.setDrawColor(94, 163, 16);
      pdf.setLineWidth(0.5);
      pdf.line(20, 60, 270, 60);

      // Crear tabla directamente en el PDF para evitar problemas con html2canvas
      const startY = 70;
      const rowHeight = 8;
      const colWidths = [50, 20, 20, 20, 20, 20, 20];
      const startX = 20;

      // Headers de la tabla
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setFillColor(94, 163, 16);
      pdf.setTextColor(255, 255, 255);

      const headers = ['Fecha', 'AMB OUT', 'AMB RET', 'IZQ EXT', 'IZQ INT', 'DER INT', 'DER EXT'];
      let currentX = startX;
      headers.forEach((header, index) => {
        pdf.rect(currentX, startY, colWidths[index], rowHeight, 'F');
        pdf.text(header, currentX + 2, startY + 5);
        currentX += colWidths[index];
      });

      // Datos de la tabla - procesar todo el historial
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      let currentPage = 1;
      let currentY = startY + rowHeight; // Empezar después del header

      // Procesar todo el historial, no solo 30 registros
      historico.forEach((row, index) => {
        // Verificar si necesitamos una nueva página
        if (currentY + rowHeight > pdf.internal.pageSize.getHeight() - 20) {
          // Agregar footer a la página actual
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 120);
          pdf.text("La Hornilla - Sistema de Monitoreo de Temperaturas", 20, pdf.internal.pageSize.getHeight() - 10);
          pdf.text(`Página ${currentPage}`, pdf.internal.pageSize.getWidth() - 30, pdf.internal.pageSize.getHeight() - 10);

          // Crear nueva página
          pdf.addPage();
          currentPage++;
          currentY = startY + rowHeight; // Resetear Y para la nueva página

          // Recrear headers en la nueva página
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setFillColor(94, 163, 16);
          pdf.setTextColor(255, 255, 255);

          currentX = startX;
          headers.forEach((header, headerIndex) => {
            pdf.rect(currentX, startY, colWidths[headerIndex], rowHeight, 'F');
            pdf.text(header, currentX + 2, startY + 5);
            currentX += colWidths[headerIndex];
          });

          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
        }

        // Fondo alternado para las filas
        if (index % 2 === 0) {
          pdf.setFillColor(240, 240, 240);
          currentX = startX;
          colWidths.forEach(width => {
            pdf.rect(currentX, currentY, width, rowHeight, 'F');
            currentX += width;
          });
        }

        // Datos de la fila
        currentX = startX;
        const rowData = [
          new Date(row.ts).toLocaleString('es-ES', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          fmt(row.AMB_OUT),
          fmt(row.AMB_RET),
          fmt(row.IZQ_EXT_ENT ?? row.PULP_3),
          fmt(row.IZQ_INT_ENT ?? row.PULP_2),
          fmt(row.DER_INT_ENT ?? row.PULP_1),
          fmt(row.DER_EXT_ENT ?? row.PULP_4)
        ];

        rowData.forEach((data, colIndex) => {
          pdf.text(data, currentX + 2, currentY + 5);
          currentX += colWidths[colIndex];
        });

        // Mover a la siguiente fila
        currentY += rowHeight;
      });

      // Footer final con numeración de página
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text("La Hornilla - Sistema de Monitoreo de Temperaturas", 20, pdf.internal.pageSize.getHeight() - 10);
      pdf.text(`Página ${currentPage}`, pdf.internal.pageSize.getWidth() - 30, pdf.internal.pageSize.getHeight() - 10);

      // Guardar el PDF
      pdf.save(`historico-tunel-${tunnelId}-${now.toISOString().split('T')[0]}.pdf`);

    } catch (e) {
      console.error("Error al exportar PDF:", e);
      alert(`Error al exportar PDF: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      {/* Eventos de proceso */}
      <div className="rounded-xl border border-slate-700/60 p-4 m-4 bg-slate-900/40">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-white">Eventos del proceso</div>
          <div className="text-xs text-slate-400">Se registran pausas, reanudaciones y finalizaciones</div>
        </div>
        {events.length === 0 ? (
          <div className="text-sm text-slate-300">Sin eventos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-700">
                  <th className="py-2">Acción</th>
                  <th className="py-2">Operador</th>
                  <th className="py-2">Fecha y hora</th>
                  <th className="py-2">Nota</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id} className="border-b border-slate-800">
                    <td className="py-2">
                      {ev.type === "paused" && "Pausa"}
                      {ev.type === "resumed" && "Reanudación"}
                      {ev.type === "finalized" && "Finalización"}
                    </td>
                    <td className="py-2">{ev.by}</td>
                    <td className="py-2">{new Date(ev.at).toLocaleString()}</td>
                    <td className="py-2">{ev.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-white px-4 pb-4">Últimas mediciones</div>
        <div className="flex items-center gap-2 m-4">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg bg-emerald-700 hover:bg-emerald-800 text-white hover:scale-105"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 2H8a2 2 0 00-2 2v3h2V4h11v16H8v-3H6v3a2 2 0 002 2h11a2 2 0 002-2V4a2 2 0 00-2-2z"/>
              <path d="M10 14l-2-2 2-2-1.4-1.4L6.2 10l-2.4-2.4L2.4 9l2.2 2.2-2.2 2.2 1.4 1.4L6.2 12l2.4 2.4L10 14z"/>
            </svg>
            Exportar Excel
          </button>

          <button
            onClick={exportPDF}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${isExporting
              ? 'bg-green-600/50 text-green-200 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
              }`}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div ref={areaRef} className="overflow-x-auto rounded-xl border border-slate-700/60 p-4 m-4 bg-slate-900/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b-2 border-green-600">
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20">Fecha</th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20">AMB OUT</th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20">AMB RET</th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20">IZQ EXT ENT</th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20">IZQ INT ENT</th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20">DER INT ENT</th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20">DER EXT ENT</th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20"> ESTADO </th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20"> COND.INI </th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20"> COND.FIN </th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20"> LECT.MIN </th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20"> LECT.MAX </th>
              <th className="py-3 px-2 font-semibold text-white bg-green-600/20"> OBSERVACION </th>
            </tr>
          </thead>
          <tbody>
            {historico.map((row, index) => (
              <tr key={row.ts} className={`border-b border-slate-700 ${index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/20'}`}>
                <td className="py-2 px-2 text-slate-200">{new Date(row.ts).toLocaleString()}</td>
                <td className="py-2 px-2 text-green-200 font-mono">{fmt(row.AMB_OUT)}</td>
                <td className="py-2 px-2 text-green-200 font-mono">{fmt(row.AMB_RET)}</td>
                <td className="py-2 px-2 text-green-200 font-mono">{fmt(row.IZQ_EXT_ENT ?? row.PULP_3)}</td>
                <td className="py-2 px-2 text-green-200 font-mono">{fmt(row.IZQ_INT_ENT ?? row.PULP_2)}</td>
                <td className="py-2 px-2 text-green-200 font-mono">{fmt(row.DER_INT_ENT ?? row.PULP_1)}</td>
                <td className="py-2 px-2 text-green-200 font-mono">{fmt(row.DER_EXT_ENT ?? row.PULP_4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-400 mt-2 p-4" >(* Datos desde API ─ refresco automático)</div>
    </div>
  );
}

/* ----------------------------------------------------------------
   UI helpers
------------------------------------------------------------------*/
function Card({ title, children, subtitle }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700/60 p-4 mx-4 mb-4 bg-slate-900/40">
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
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") onChange(0); // Default a 0 si está vacío
          else onChange(Number(val)); // convierte solo si hay número
        }}
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
