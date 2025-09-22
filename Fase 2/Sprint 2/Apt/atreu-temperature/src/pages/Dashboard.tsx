// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import TunnelDetail from "../components/TunnelDetail";
import {
  TUNELES_MOCK,
  RANGOS_POR_FRUTA,
  estadoSensor,
  toRectSensors, // <- asegúrate de tener este adaptador en src/data/tunnelMock.ts
} from "../data/tunnelMock";

/* =======================  DASHBOARD  ======================= */
export default function Dashboard() {
  const [selected, setSelected] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(t);
  }, []);

  // cámaras simuladas (puedes reemplazar cuando conectes backend)
  const cameras = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        temp: +(6 + Math.random() * 3).toFixed(1),
      })),
    [tick]
  );

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <h1 className="text-4xl font-extrabold mb-6">Temperaturas</h1>

      {/* GRID DE TÚNELES (compacto) */}
      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        {TUNELES_MOCK.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-sky-900/40 bg-slate-900/60 p-3 hover:ring-2 hover:ring-sky-500/60 transition cursor-pointer"
            role="button"
            onClick={() => setSelected(t.id)}
          >
            {/* encabezado */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-semibold">Túnel {t.id}</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-100">
                  {t.fruta}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  tick {tick}
                </span>
              </div>
            </div>

            <TunnelCardRect tunId={t.id} fruta={t.fruta} />
          </div>
        ))}
      </div>

      {/* CÁMARAS */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Cámaras</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {cameras.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2"
            >
              <span className="text-sm">Cámara {c.id}</span>
              <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded">
                {c.temp}°C
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DETALLE */}
      {selected && (
        <TunnelDetail
            tunnelId={selected}
            open={true}
            onClose={() => setSelected(null)} frutaActual={"CEREZA"} frutasDisponibles={[]}
            onChangeFruit={function (f: "CEREZA" | "UVA" | "CLEMENTINA" | "GENÉRICA"): void {
                throw new Error("Function not implemented.");
            }} rangeOverride={{
            min: 0,
            max: 0,
            idealMin: 0,
            idealMax: 0
        }} onChangeRanges={function (r: { min: number; max: number; idealMin: number; idealMax: number; }): void {
            throw new Error("Function not implemented.");
        }}        />
      )}

      <footer className="text-center text-xs text-slate-500 mt-8 mb-2">
        © 2025 Atreu Temperature — Sprint 1
      </footer>
    </div>
  );
}

/* ===================  TARJETA RECTANGULAR  =================== */
/**
 * Vista “desde arriba” compacta (cliente pidió: AMB_OUT arriba, AMB_RET abajo,
 * y cuatro sensores: IZQ_EXT/INT entrada, DER_INT/EXT entrada, más línea de salida).
 * Tamaño pensado para caber 8 túneles en 2 filas sin scroll en 1080p.
 */
function TunnelCardRect({
  tunId,
  fruta,
}: {
  tunId: number;
  fruta: keyof typeof RANGOS_POR_FRUTA;
}) {
  const s = toRectSensors(tunId);
  const range = RANGOS_POR_FRUTA[fruta];

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
      {/* AMB OUT */}
      <div className="flex justify-center mb-1">
        <Badge label={fmt(s.AMB_OUT)} />
      </div>

      {/* marco */}
      <div className="mx-auto w-full rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-900/60 to-slate-950/40 p-3">
        {/* barra roja (túnel de aire) */}
        <div className="mx-auto mb-2 h-1 w-[75%] rounded-full bg-rose-500 shadow-[0_0_10px_#fb7185]" />

        {/* caja interior */}
        <div className="mx-auto h-[120px] w-[92%] rounded-xl border border-slate-700/40 px-2">
          <div className="grid grid-cols-3 h-full">
            {/* izquierda */}
            <div className="flex flex-col items-start justify-between py-2">
              <ChipSide
                label="EXT IZQ ENT"
                v={s.IZQ_EXT_ENT}
                state={sensorState(s.IZQ_EXT_ENT, range)}
              />
              <ChipSide
                label="INT IZQ ENT"
                v={s.IZQ_INT_ENT}
                state={sensorState(s.IZQ_INT_ENT, range)}
              />
            </div>
            <div className="flex items-center justify-center">
              {/* espacio central (pallets) */}
            </div>
            {/* derecha */}
            <div className="flex flex-col items-end justify-between py-2">
              <ChipSide
                label="DER INT ENT"
                v={s.DER_INT_ENT}
                align="right"
                state={sensorState(s.DER_INT_ENT, range)}
              />
              <ChipSide
                label="EXT DER ENT"
                v={s.DER_EXT_ENT}
                align="right"
                state={sensorState(s.DER_EXT_ENT, range)}
              />
            </div>
          </div>
        </div>

        {/* fila de SALIDA (solo etiquetas) */}
        <div className="mt-2 grid grid-cols-4 text-[10px] text-slate-300">
          <div className="text-left">EXT IZQ SAL</div>
          <div className="text-left">INT IZQ SAL</div>
          <div className="text-right">INT DER SAL</div>
          <div className="text-right">EXT DER SAL</div>
        </div>
      </div>

      {/* AMB RET */}
      <div className="mt-1 flex justify-center">
        <Badge small label={fmt(s.AMB_RET)} />
      </div>
    </div>
  );
}

/* =======================  SUBCOMPONENTES  ======================= */

function ChipSide({
  label,
  v,
  align = "left",
  state,
}: {
  label: string;
  v: number | "OUT";
  align?: "left" | "right";
  state: "ok" | "warn" | "alarm" | "idle";
}) {
  const color =
    state === "alarm"
      ? "bg-rose-600"
      : state === "warn"
      ? "bg-amber-600"
      : state === "ok"
      ? "bg-emerald-600"
      : "bg-slate-600";

  return (
    <span
      className={`rounded-full ${color} text-white text-[11px] px-2 py-0.5 ${
        align === "right" ? "ml-auto" : ""
      }`}
    >
      {label} {fmt(v)}
    </span>
  );
}

function Badge({
  label,
  text,
  small = false,
}: {
  label: string;
  text?: string;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {text && <span className="text-[10px] text-slate-300">{text}</span>}
      <span
        className={`inline-block rounded bg-slate-800 text-slate-100 ${
          small ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* =======================  HELPERS  ======================= */

function fmt(v: number | "OUT") {
  return typeof v === "number" ? `${v.toFixed(1)}°C` : "OUT";
}

function sensorState(
  v: number | "OUT",
  range: (typeof RANGOS_POR_FRUTA)[keyof typeof RANGOS_POR_FRUTA]
): "ok" | "warn" | "alarm" | "idle" {
  if (v === "OUT") return "idle";
  const st = estadoSensor(v, range);
  if (st.startsWith("ALARM")) return "alarm";
  if (st.startsWith("WARN")) return "warn";
  if (st === "OK") return "ok";
  return "idle";
}
