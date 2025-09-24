// src/components/TunnelDetail.tsx
import { useMemo, useRef, useState } from "react";
import Modal from "./Modal";
import Tabs, { TabItem } from "./Tabs";
import ChartTab from "./ChartTab";
import {
  TUNELES_MOCK,
  RANGOS_POR_FRUTA,
  getHistorico,
} from "../data/tunnelMock";

type Fruit = keyof typeof RANGOS_POR_FRUTA;
type RangeOverride = { min: number; max: number; idealMin: number; idealMax: number };
type ProcesoEstado = "libre" | "en_proceso" | "pausado" | "finalizado";

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

  // frutas disponibles (desde las keys del mapa de rangos)
  const frutasDisponibles = useMemo(
    () => Object.keys(RANGOS_POR_FRUTA) as Fruit[],
    []
  );

  // fruta y rangos (por defecto, los del túnel/especie)
  const [fruit, setFruit] = useState<Fruit>(tun.fruta as Fruit);
  const [ranges, setRanges] = useState<RangeOverride>(() => {
    const r = RANGOS_POR_FRUTA[tun.fruta as Fruit];
    return { min: r.min, max: r.max, idealMin: r.idealMin, idealMax: r.idealMax };
  });

  // al cambiar fruta, resetea rangos por defecto de esa especie
  function handleChangeFruit(f: Fruit) {
    setFruit(f);
    const r = RANGOS_POR_FRUTA[f];
    setRanges({ min: r.min, max: r.max, idealMin: r.idealMin, idealMax: r.idealMax });
  }

  // histórico simulado (para Gráfico e Histórico)
  const historico = useMemo(() => getHistorico(tunnelId, 60), [tunnelId]);

  // mínimos/máximos actuales
  const minOfTunnel = useMemo(() => {
    const nums = Object.values(tun.sensores).filter((v) => typeof v === "number") as number[];
    return nums.length ? `${Math.min(...nums).toFixed(1)}°C` : "N/A";
  }, [tun]);
  const maxOfTunnel = useMemo(() => {
    const nums = Object.values(tun.sensores).filter((v) => typeof v === "number") as number[];
    return nums.length ? `${Math.max(...nums).toFixed(1)}°C` : "N/A";
  }, [tun]);

  const tabs: TabItem[] = [
    {
      key: "temperaturas",
      label: "Temperaturas",
      content: (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card title="Temp. mínima actual"><Big>{minOfTunnel}</Big></Card>
          <Card title="Temp. máxima actual"><Big>{maxOfTunnel}</Big></Card>
          <Card title={`Rango ideal (${fruit})`}>
            <div className="flex items-center gap-2 text-2xl font-bold">
              {ranges.idealMin}°C – {ranges.idealMax}°C
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Alarmas: &lt; {ranges.min}°C o &gt; {ranges.max}°C
            </div>
          </Card>

          {/* Selector de fruta + editor de rangos */}
          <div className="lg:col-span-3 rounded-xl border border-slate-700/60 p-4 bg-slate-900/40">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Especie (fruta)">
                <select
                  value={fruit}
                  onChange={(e) => handleChangeFruit(e.target.value as Fruit)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                >
                  {frutasDisponibles.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </Field>
              <div className="grid sm:grid-cols-4 gap-3">
                <NumberBox label="Mín. alarma" value={ranges.min} onChange={(v) => setRanges((r)=>({...r, min:v}))}/>
                <NumberBox label="Máx. alarma" value={ranges.max} onChange={(v) => setRanges((r)=>({...r, max:v}))}/>
                <NumberBox label="Ideal desde" value={ranges.idealMin} onChange={(v) => setRanges((r)=>({...r, idealMin:v}))}/>
                <NumberBox label="Ideal hasta" value={ranges.idealMax} onChange={(v) => setRanges((r)=>({...r, idealMax:v}))}/>
              </div>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Al cambiar la fruta se restablecen los rangos por defecto de esa especie.
            </div>
          </div>

          {/* Ambiente/Retorno (chips) */}
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
      key: "procesos",
      label: "Procesos",
      content: (
        <ProcesosMejorados
          frutaActual={fruit}
          frutasDisponibles={frutasDisponibles}
          onChangeFruit={handleChangeFruit}
        />
      ),
    },
    {
      key: "grafico",
      label: "Gráfico",
      content: <ChartTab historico={historico} />,
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

/* ───────── Procesos MEJORADOS (UI mock Sprint 1) ───────── */

function ProcesosMejorados({
  frutaActual,
  frutasDisponibles,
  onChangeFruit,
}: {
  frutaActual: Fruit;
  frutasDisponibles: Fruit[];
  onChangeFruit: (f: Fruit) => void;
}) {
  // estado local simulado del proceso
  const [estado, setEstado] = useState<ProcesoEstado>("libre");
  const [mensaje, setMensaje] = useState<string | null>(null);

  // formulario base (crear/modificar)
  const [form, setForm] = useState({
    fechaInicio: "",
    frecuencia: "15",
    destino: "",
    operador: "",
    condicion: "",
    origen: "",
  });

  function toast(msg: string) {
    setMensaje(msg);
    setTimeout(() => setMensaje(null), 2500);
  }

  function crearProceso() {
    setEstado("en_proceso");
    toast("Proceso iniciado");
  }
  function pausar() {
    setEstado("pausado");
    toast("Proceso pausado");
  }
  function continuar() {
    setEstado("en_proceso");
    toast("Proceso continuado");
  }
  function modificar() {
    toast("Cambios guardados");
  }
  function finalizar() {
    setEstado("finalizado");
    toast("Proceso finalizado");
  }

  return (
    <div className="space-y-4">
      {/* barra de estado + acciones rápidas */}
      <div className="flex flex-wrap items-center gap-2 justify-between rounded-xl border border-slate-700/60 p-3 bg-slate-900/40">
        <div className="text-sm">
          Estado:&nbsp;
          <span className={`px-2 py-0.5 rounded text-xs ${
            estado === "libre" ? "bg-slate-700" :
            estado === "en_proceso" ? "bg-emerald-600" :
            estado === "pausado" ? "bg-amber-600" : "bg-slate-600"
          }`}>
            {estado}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {estado === "libre" && (
            <button onClick={crearProceso} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500">Crear</button>
          )}
          {estado === "en_proceso" && (
            <>
              <button onClick={pausar} className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-500">Pausar</button>
              <button onClick={finalizar} className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500">Finalizar</button>
            </>
          )}
          {estado === "pausado" && (
            <>
              <button onClick={continuar} className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500">Continuar</button>
              <button onClick={finalizar} className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500">Finalizar</button>
            </>
          )}
          {estado === "finalizado" && (
            <button onClick={() => setEstado("libre")} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600">Reiniciar</button>
          )}
        </div>
      </div>

      {/* formulario (crear/modificar) */}
      <div className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40">
        <div className="font-semibold mb-3">Datos del Proceso</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Field label="Fecha inicio">
              <input
                type="datetime-local"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={form.fechaInicio}
                onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                disabled={estado !== "libre"}
              />
            </Field>
            <Field label="Mediciones">
              <select
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={form.frecuencia}
                onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
                disabled={estado === "finalizado"}
              >
                <option value="15">Cada 15 min</option>
                <option value="5">Cada 5 min</option>
                <option value="1">Cada 1 min</option>
              </select>
            </Field>
            <Field label="Destino">
              <input
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={form.destino}
                onChange={(e) => setForm({ ...form, destino: e.target.value })}
                disabled={estado === "finalizado"}
              />
            </Field>
            <Field label="Operador inicial">
              <input
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={form.operador}
                onChange={(e) => setForm({ ...form, operador: e.target.value })}
                disabled={estado === "finalizado"}
              />
            </Field>
            <Field label="Condición inicial">
              <textarea
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 h-20"
                value={form.condicion}
                onChange={(e) => setForm({ ...form, condicion: e.target.value })}
                disabled={estado === "finalizado"}
              />
            </Field>
          </div>

          <div className="grid gap-2">
            <Field label="Especie (fruta)">
              <select
                value={frutaActual}
                onChange={(e) => onChangeFruit(e.target.value as Fruit)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                disabled={estado === "finalizado"}
              >
                {frutasDisponibles.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Fecha último cambio">
              <input disabled className="w-full rounded border border-slate-800 bg-slate-800/60 px-3 py-2" />
            </Field>
            <Field label="Origen">
              <input
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={form.origen}
                onChange={(e) => setForm({ ...form, origen: e.target.value })}
                disabled={estado === "finalizado"}
              />
            </Field>
            <Field label="Estado">
              <input disabled value={estado} className="w-full rounded border border-slate-800 bg-slate-800/60 px-3 py-2" />
            </Field>

            <div className="flex gap-2 pt-2">
              {estado === "libre" && (
                <button onClick={crearProceso} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500">Iniciar</button>
              )}
              {(estado === "en_proceso" || estado === "pausado") && (
                <button onClick={modificar} className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500">Guardar cambios</button>
              )}
              {estado !== "finalizado" && estado !== "libre" && (
                <button onClick={finalizar} className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500">Finalizar</button>
              )}
            </div>
          </div>
        </div>

        {mensaje && (
          <div className="mt-3 text-xs px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-200 inline-block">
            {mensaje}
          </div>
        )}

        <div className="text-xs text-slate-400 mt-2">
          Sprint 1.
        </div>
      </div>
    </div>
  );
}

/* ───────── Histórico (tabla simple) ───────── */

function Historico({ historico, tunnelId }: { historico: any[]; tunnelId: number }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const cols = Object.keys(historico?.[0] ?? {}).filter((k) => k !== "ts");

  return (
    <div ref={areaRef} className="overflow-x-auto rounded-xl border border-slate-700/60 p-3 bg-slate-900/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-slate-700">
            <th className="py-2">Fecha</th>
            {cols.map((k) => <th key={k} className="py-2">{k}</th>)}
          </tr>
        </thead>
        <tbody>
          {historico.map((row) => (
            <tr key={row.ts} className="border-b border-slate-800">
              <td className="py-2">{new Date(row.ts).toLocaleString()}</td>
              {cols.map((k) => <td key={k} className="py-2">{fmt(row[k])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-xs text-slate-400 mt-2">Datos simulados — Túnel {tunnelId}</div>
    </div>
  );
}

/* ───────── Utilitarios UI ───────── */

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
    <label className="text-sm">
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
function Badge({ value }: { value: number | "OUT" }) {
  return (
    <span className="inline-block rounded bg-slate-800 text-slate-100 text-xs px-3 py-1">
      {typeof value === "number" ? `${value}°C` : "OUT"}
    </span>
  );
}
function fmt(v: any) {
  return typeof v === "number" ? `${v}°C` : v ?? "—";
}
