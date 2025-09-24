import React from "react";
import {
  RANGOS_POR_FRUTA,
  TUNELES_MOCK,
  estadoSensor,
} from "../data/tunnelMock";

/* =========================================================
   Tipos
   ========================================================= */
export type Fruit = keyof typeof RANGOS_POR_FRUTA;

export type TunnelSketchData = {
  id: number;
  fruta: Fruit;
  status?: "Disponible" | "En Ejecución" | "Libre";
  // Ambiente (salida) y Retorno
  ambOut: number | "OUT";
  ambRet: number | "OUT";
  // ENTRADA (4)
  izqExtEnt: number | "OUT";
  izqIntEnt: number | "OUT";
  derIntEnt: number | "OUT";
  derExtEnt: number | "OUT";
  // SALIDA (4)
  izqExtSal: number | "OUT";
  izqIntSal: number | "OUT";
  derIntSal: number | "OUT";
  derExtSal: number | "OUT";
};

/* =========================================================
   Helpers UI
   ========================================================= */
function chipClasses(state: string) {
  // mapeo de estado -> color
  if (state.startsWith("ALARM")) return "bg-red-600/30 text-red-100 ring-1 ring-red-400/40";
  if (state.startsWith("WARN")) return "bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/40";
  if (state === "OK") return "bg-emerald-600/30 text-emerald-100 ring-1 ring-emerald-400/40";
  return "bg-slate-700/35 text-slate-200 ring-1 ring-slate-600/40";
}

function formatted(value: number | "OUT") {
  return typeof value === "number" ? `${value}°C` : "OUT";
}

function TempChip({
  title,
  value,
  fruta,
}: {
  title: string;
  value: number | "OUT";
  fruta: Fruit;
}) {
  const rango = RANGOS_POR_FRUTA[fruta];
  const state =
    typeof value === "number" ? estadoSensor(value, rango) : "NA";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`min-w-[70px] px-2 py-1 rounded-md text-[12px] font-medium ${chipClasses(state)}`}>
        {formatted(value)}
      </div>
      <div className="text-[11px] text-on/70 text-center">{title}</div>
    </div>
  );
}

function HeaderChip({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "ok" }) {
  const base =
    "text-[11px] px-2 py-1 rounded shadow-sm";
  const map: Record<string, string> = {
    brand: "bg-brand text-white",
    ok: "bg-emerald-600 text-white",
  };
  return <span className={`${base} ${map[tone]}`}>{children}</span>;
}

/* =========================================================
   Tarjeta tipo bosquejo (8 sensores)
   ========================================================= */
export default function TunnelSketchCard({
  data,
  onClick,
}: {
  data: TunnelSketchData;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border/70 bg-card/80 backdrop-blur-[2px] hover:bg-card/95 transition shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)] focus:outline-none focus:ring-2 focus:ring-brand/40"
    >
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="text-on/85 font-semibold">{`Túnel ${data.id}`}</div>
        <div className="flex items-center gap-2">
          {data.status && <HeaderChip tone="ok">{data.status}</HeaderChip>}
          <HeaderChip>{data.fruta}</HeaderChip>
        </div>
      </div>

      {/* Marco (recinto) */}
      <div className="p-5">
        <div className="rounded-[20px] border border-border/70 bg-[#0b1420]/60 px-5 py-6 relative overflow-hidden">
          {/* Barra ventiladores */}
          <div className="absolute left-10 right-10 top-7 h-1 bg-rose-500/65 rounded-full shadow-[0_0_18px_4px_rgba(244,63,94,0.35)]" />

          {/* Ambiente / Retorno centrados */}
          <div className="flex items-center justify-center gap-8 mb-7">
            <div className="flex flex-col items-center">
              <div className="text-[11px] text-on/65 mb-1">Ambiente</div>
              <div className="rounded bg-slate-800/80 text-slate-100 text-[12px] px-2 py-1 ring-1 ring-slate-700/60">
                {formatted(data.ambOut)}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-[11px] text-on/65 mb-1">Retorno</div>
              <div className="rounded bg-slate-800/80 text-slate-100 text-[12px] px-2 py-1 ring-1 ring-slate-700/60">
                {formatted(data.ambRet)}
              </div>
            </div>
          </div>

          {/* ENTRADA (fila superior – 4 sensores) */}
          <div className="grid grid-cols-4 gap-x-6 gap-y-4 mb-6">
            <TempChip title="EXT. IZQ. ENTRADA" value={data.izqExtEnt} fruta={data.fruta} />
            <TempChip title="INT. IZQ. ENTRADA" value={data.izqIntEnt} fruta={data.fruta} />
            <TempChip title="INT. DER. ENTRADA" value={data.derIntEnt} fruta={data.fruta} />
            <TempChip title="EXT. DER. ENTRADA" value={data.derExtEnt} fruta={data.fruta} />
          </div>

          {/* Separador */}
          <div className="my-3 mx-6 h-[2px] bg-slate-800/40 rounded-full" />

          {/* SALIDA (fila inferior – 4 sensores) */}
          <div className="grid grid-cols-4 gap-x-6 gap-y-4">
            <TempChip title="EXT. IZQ. SALIDA" value={data.izqExtSal} fruta={data.fruta} />
            <TempChip title="INT. IZQ. SALIDA" value={data.izqIntSal} fruta={data.fruta} />
            <TempChip title="INT. DER. SALIDA" value={data.derIntSal} fruta={data.fruta} />
            <TempChip title="EXT. DER. SALIDA" value={data.derExtSal} fruta={data.fruta} />
          </div>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   Mapper desde tu mock (8 sensores)
   - Si aún no tienes sensores de salida, los mostramos OUT.
   - Ajusta este wiring cuando tengas los reales.
   ========================================================= */
export function mapSketchFromMock(id: number): TunnelSketchData {
  const t = TUNELES_MOCK.find((x) => x.id === id)!;
  const s = t.sensores;

  // ENTRADA (usamos tus PULP_1..4 para mantener consistencia)
  const izqExtEnt = s.PULP_1;
  const izqIntEnt = s.PULP_2;
  const derIntEnt = s.PULP_3;
  const derExtEnt = s.PULP_4 ?? "OUT";

  // SALIDA (por ahora OUT si no existen)
  const izqExtSal: number | "OUT" = "OUT";
  const izqIntSal: number | "OUT" = "OUT";
  const derIntSal: number | "OUT" = "OUT";
  const derExtSal: number | "OUT" = "OUT";

  return {
    id: t.id,
    fruta: t.fruta,
    status: "Disponible",
    ambOut: s.AMB_OUT,
    ambRet: s.AMB_RET,
    izqExtEnt,
    izqIntEnt,
    derIntEnt,
    derExtEnt,
    izqExtSal,
    izqIntSal,
    derIntSal,
    derExtSal,
  };
}
