// src/components/TunnelCardRect.tsx
import React from "react";
import { TUNELES_MOCK } from "../data/tunnelMock";
import StatusPills from "./StatusPills";

export type SensorsShort = {
  AMB_OUT: number | "OUT";
  AMB_RET: number | "OUT";
  PULP_1: number | "OUT";
  PULP_2: number | "OUT";
  PULP_3: number | "OUT";
  PULP_4: number | "OUT";
};

/**
 * Tarjeta “angosta” estilo bosquejo:
 * - Marco exterior (tarjeta)
 * - Tubo superior rojo (ventilación)
 * - Ambiente (arriba) / Retorno (debajo)
 * - 4 sensores de ENTRADA (fila) + separador + 4 sensores de SALIDA (fila)
 *
 * Props:
 *  id: número de túnel (obligatorio)
 *  fruta: etiqueta actual (opcional; NO se muestra si el túnel está “Disponible”)
 *  sensores: lecturas actuales; si no viene => fallback a mock
 *  onClick: callback para abrir modal detalle
 */
export default function TunnelCardRect({
  id,
  fruta,
  sensores,   // 
  onClick,
}: {
  id: number;
  fruta?: string;
  sensores?: SensorsShort | null;
  onClick?: () => void;
}) {
  // Fallback: mock solo si no se entregan sensores por props
  const mock = TUNELES_MOCK.find((t) => t.id === id)!;
  const data = sensores ?? mock.sensores;

  // --- Mapeo 8 sensores (según bosquejo) ---
  // ENTRADA 
  const IZQ_EXT_ENT = data.PULP_1; // 
  const IZQ_INT_ENT = data.PULP_2;
  const DER_INT_ENT = data.PULP_3;
  const DER_EXT_ENT = data.PULP_4;

  // SALIDA (no vienen en /api/tunnels → OUT)
  const IZQ_EXT_SAL: number | "OUT" = "OUT";
  const IZQ_INT_SAL: number | "OUT" = "OUT";
  const DER_INT_SAL: number | "OUT" = "OUT";
  const DER_EXT_SAL: number | "OUT" = "OUT";

  const AMB_OUT = data.AMB_OUT;
  const AMB_RET = data.AMB_RET;

  // --- Subcomponentes internos simples ---
  const Chip = ({ children }: { children: React.ReactNode }) => (
    <span className="px-1.5 py-[2px] text-[10px] rounded-md bg-slate-800 text-slate-100 border border-slate-600">
      {children}
    </span>
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="block text-[10px] text-slate-300 leading-tight truncate">{children}</span>
  );

  const Val = ({ v }: { v: number | "OUT" }) => (
    <Chip>{typeof v === "number" ? `${v}°C` : "OUT"}</Chip>
  );

  const SensorCell = ({
    value,
    label,
  }: {
    value: number | "OUT";
    label: string;
  }) => (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <Val v={value} />
      <Label>{label}</Label>
    </div>
  );

  return (
    <button
      onClick={onClick}
      aria-label={`Abrir detalle de Túnel ${id}`}
      className="
        group relative w-full max-w-[420px] 2xl:max-w-[440px]
        rounded-2xl border border-slate-700 bg-slate-900/70 hover:bg-slate-900
        transition-colors text-left shadow-sm
      "
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="text-[13px] font-semibold text-slate-100">Túnel {id}</div>
        <StatusPills tunnelId={id} />
      </div>

      {/* Cuerpo */}
      <div className="mt-2 px-3 pb-3">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
          {/* Tubo/ventilación superior */}
          <div className="relative">
            <div className="h-1.5 rounded-full bg-rose-500/80 shadow-[0_0_14px_#f43f5e]" />
            {/* Ambiente / Retorno centrados (apilados) */}
            <div className="w-full flex flex-col items-center gap-1 -mt-3">
              <div className="flex flex-col items-center">
                <Label>Ambiente</Label>
                <Chip>{typeof AMB_OUT === "number" ? `${AMB_OUT}°C` : "OUT"}</Chip>
              </div>
              <div className="flex flex-col items-center">
                <Label>Retorno</Label>
                <Chip>{typeof AMB_RET === "number" ? `${AMB_RET}°C` : "OUT"}</Chip>
              </div>
            </div>
          </div>

          {/* Fila ENTRADA */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            <SensorCell value={IZQ_EXT_ENT} label="EXT. IZQ, ENTRADA" />
            <SensorCell value={IZQ_INT_ENT} label="INT. IZQ, ENTRADA" />
            <SensorCell value={DER_INT_ENT} label="INT. DER, ENTRADA" />
            <SensorCell value={DER_EXT_ENT} label="EXT. DER, ENTRADA" />
          </div>

          {/* Separador */}
          <div className="my-3 h-px bg-slate-600/30 rounded-full" />

          {/* Fila SALIDA */}
          <div className="grid grid-cols-4 gap-2">
            <SensorCell value={IZQ_EXT_SAL} label="EXT. IZQ, SALIDA" />
            <SensorCell value={IZQ_INT_SAL} label="INT. IZQ, SALIDA" />
            <SensorCell value={DER_INT_SAL} label="INT. DER, SALIDA" />
            <SensorCell value={DER_EXT_SAL} label="EXT. DER, SALIDA" />
          </div>
        </div>
      </div>
    </button>
  );
}
