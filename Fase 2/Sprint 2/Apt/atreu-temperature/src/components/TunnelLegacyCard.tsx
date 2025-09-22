// src/components/TunnelLegacyCard.tsx
import { SENSOR_DEFS, RANGOS_POR_FRUTA, estadoSensor, Tunnel } from "../data/tunnelMock";

export default function TunnelLegacyCard({
  tunnel,
  tick,
  onClick,
}: {
  tunnel: Tunnel;
  tick?: number; // opcional, sólo para mostrar un "tick" como en legacy
  onClick?: () => void;
}) {
  const rango = RANGOS_POR_FRUTA[tunnel.fruta];

  const chip = (v: number | "OUT") => {
    if (v === "OUT") return "bg-slate-600";
    const s = estadoSensor(v, rango);
    if (s.startsWith("ALARM")) return "bg-rose-600";
    if (s.startsWith("WARN")) return "bg-amber-600";
    if (s === "OK") return "bg-emerald-600";
    return "bg-slate-600";
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-900/80 transition shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      title={`Túnel ${tunnel.id} — ${tunnel.fruta}`}
    >
      {/* Header estrecho, como el legado */}
      <div className="px-3 py-2 border-b border-slate-700 bg-slate-900/70 flex items-center justify-between">
        <div className="text-sm font-semibold">Túnel {tunnel.id}</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 uppercase">
            {tunnel.fruta}
          </span>
          {typeof tick === "number" && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60">tick {tick}</span>
          )}
        </div>
      </div>

      {/* Lista de sensores en columna */}
      <div className="p-3 space-y-1.5">
        {SENSOR_DEFS.map((s) => {
          const val = tunnel.sensores[s.id];
          return (
            <div
              key={s.id}
              className="flex items-center justify-between rounded border border-slate-700/60 bg-slate-800/40 px-2 py-1"
              title={`${s.label} • ${s.position}`}
            >
              <span className="text-xs text-slate-300">{s.label}</span>
              <span
                className={`text-[10px] text-white px-2 py-0.5 rounded ${chip(val)}`}
              >
                {val === "OUT" ? "OUT" : `${val}°C`}
              </span>
            </div>
          );
        })}
      </div>
    </button>
  );
}
