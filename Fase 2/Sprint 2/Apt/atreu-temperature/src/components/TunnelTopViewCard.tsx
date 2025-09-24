// src/components/TunnelTopViewCard.tsx
import { TUNELES_MOCK, RANGOS_POR_FRUTA, estadoSensor } from "../data/tunnelMock";

type Props = {
  tunnel: (typeof TUNELES_MOCK)[number];
  tick?: number;
  onClick?: () => void;
};

/**
 * Vista superior del túnel (según feedback):
 * - Arriba centro: AMB OUT (ambiente/salida)
 * - Abajo centro: AMB RET (retorno)
 * - Solo 4 sensores: Izq Ext, Izq Int (entrada) y Der Int, Der Ext (salida)
 * - Sin sensor central (el del medio NO se contempla)
 *
 * Mapeo sugerido de PULP_n -> posiciones:
 *  - PULP_3: IZQ EXTERIOR
 *  - PULP_4: IZQ INTERIOR
 *  - PULP_1: DER INTERIOR
 *  - PULP_2: DER EXTERIOR
 * Si tu backend usa otro orden, cambia labels y claves abajo.
 */
export default function TunnelTopViewCard({ tunnel, tick, onClick }: Props) {
  const rango = RANGOS_POR_FRUTA[tunnel.fruta];

  // === Mapeo de 4 sensores (ajusta aquí si tu asignación real es distinta)
  const IZQ_EXT = tunnel.sensores.PULP_3 as number | "OUT";
  const IZQ_INT = tunnel.sensores.PULP_4 as number | "OUT";
  const DER_INT = tunnel.sensores.PULP_1 as number | "OUT";
  const DER_EXT = tunnel.sensores.PULP_2 as number | "OUT";

  const AMB_OUT = tunnel.sensores.AMB_OUT as number | "OUT";
  const AMB_RET = tunnel.sensores.AMB_RET as number | "OUT";

  const cap = (label: string, v: number | "OUT") => {
    const bg = v === "OUT" ? "bg-slate-600" : colorByState(v as number, rango);
    return (
      <div
        className={`px-2.5 py-1 rounded-full text-[11px] text-white tracking-tight ${bg} shadow-sm
                    border border-white/10 whitespace-nowrap`}
      >
        <span className="opacity-90">{label}</span>
        <span className="ml-1.5 font-bold">{v === "OUT" ? "OUT" : `${v}°C`}</span>
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border border-border/70 bg-card hover:bg-card transition
                 hover:ring-2 hover:ring-sky-500/40 focus:outline-none focus:ring-2 focus:ring-sky-500/60 p-4 focus-brand"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-on font-semibold">Túnel {tunnel.id}</div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-card text-on focus-brand">{tunnel.fruta}</span>
          {typeof tick === "number" && (
            <span className="px-2 py-0.5 rounded bg-card text-on focus-brand">tick {tick}</span>
          )}
        </div>
      </div>

      {/* Lienzo */}
      <div
        className="relative rounded-2xl border border-border/70 bg-gradient-to-b from-slate-900 to-slate-950
                   shadow-inner overflow-hidden aspect-[4/3] max-h-[240px] mx-auto"
      >
        {/* marco interior */}
        <div className="absolute inset-2 rounded-xl bg-card border border-slate-800 focus-brand" />

        {/* Barra roja – salida/ventiladores (arriba) */}
        <div className="absolute left-10 right-10 top-4 h-2 rounded-full bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
        {/* Barra inferior (retorno/entrada) */}
        <div className="absolute left-16 right-16 bottom-4 h-1.5 rounded-full bg-card focus-brand" />

        {/* AMB OUT (arriba centro) */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          {cap("AMB OUT", AMB_OUT)}
        </div>
        {/* AMB RET (abajo centro) */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          {cap("AMB RET", AMB_RET)}
        </div>

        {/* Columnas guía laterales (sutiles) */}
        <div className="absolute top-10 bottom-10 left-[18%] w-[2px] bg-card focus-brand" />
        <div className="absolute top-10 bottom-10 right-[18%] w-[2px] bg-card focus-brand" />

        {/* 4 sensores (sin central) */}
        {/* Lado IZQUIERDO (entrada) */}
        <div className="absolute top-[22%] left-[6%]">{cap("IZQ EXT", IZQ_EXT)}</div>
        <div className="absolute bottom-[22%] left-[6%]">{cap("IZQ INT", IZQ_INT)}</div>

        {/* Lado DERECHO (salida) */}
        <div className="absolute top-[22%] right-[6%]">{cap("DER INT", DER_INT)}</div>
        <div className="absolute bottom-[22%] right-[6%]">{cap("DER EXT", DER_EXT)}</div>
      </div>
    </button>
  );
}

/* ---------- helpers ---------- */
function colorByState(v: number, rango: (typeof RANGOS_POR_FRUTA)[keyof typeof RANGOS_POR_FRUTA]) {
  const st = estadoSensor(v, rango);
  if (st.startsWith("ALARM")) return "bg-rose-600";
  if (st.startsWith("WARN")) return "bg-amber-600";
  if (st === "OK") return "bg-emerald-600";
  return "bg-slate-600";
}
