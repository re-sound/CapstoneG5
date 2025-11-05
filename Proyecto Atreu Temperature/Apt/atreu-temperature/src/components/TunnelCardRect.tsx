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
    <span className="px-1 sm:px-1.5 py-[1px] sm:py-[2px] text-[8px] sm:text-[10px] rounded-md bg-slate-800 text-green-100 border border-slate-600">
      {children}
    </span>
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="block text-[7px] sm:text-[9px] text-green-200 leading-tight text-center whitespace-nowrap overflow-hidden">{children}</span>
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
    <div className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-0 px-0.5 sm:px-1">
      <Val v={value} />
      <Label>{label}</Label>
    </div>
  );

  return (
    <div className="w-full">
      {/* Nombre del túnel fuera del cuadro */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs sm:text-sm font-semibold text-white">Túnel {id}</div>
        <StatusPills tunnelId={id} />
      </div>

      {/* Cuadro del túnel */}
      <button
        onClick={onClick}
        aria-label={`Abrir detalle de Túnel ${id}`}
        className="
          group relative w-full h-fit
          rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-900/70 hover:bg-slate-900
          transition-all duration-200 text-left shadow-sm hover:shadow-md
          hover:scale-[1.01] sm:hover:scale-[1.02] hover:border-slate-600
        "
      >
        {/* Cuerpo */}
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="rounded-lg sm:rounded-xl border border-slate-700 bg-slate-900/60 p-2 sm:p-3">
            {/* Tubo/ventilación superior */}
            <div className="relative">
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
            <div className="grid grid-cols-4 gap-0.5 sm:gap-1 mt-3 sm:mt-5">
              <SensorCell value={IZQ_EXT_ENT} label="EXT. IZQ" />
              <SensorCell value={IZQ_INT_ENT} label="INT. IZQ" />
              <SensorCell value={DER_INT_ENT} label="INT. DER" />
              <SensorCell value={DER_EXT_ENT} label="EXT. DER" />
            </div>

            {/* Separador */}
            <div className="my-2 sm:my-3 h-px bg-slate-600/30 rounded-full" />

            {/* Fila SALIDA */}
            <div className="grid grid-cols-4 gap-0.5 sm:gap-1">
              <SensorCell value={IZQ_EXT_SAL} label="EXT. IZQ" />
              <SensorCell value={IZQ_INT_SAL} label="INT. IZQ" />
              <SensorCell value={DER_INT_SAL} label="INT. DER" />
              <SensorCell value={DER_EXT_SAL} label="EXT. DER" />
            </div>
            <div className="h-1.5 rounded-full bg-rose-500/80 shadow-[0_0_14px_#f43f5e] mt-3" />
          </div>
        </div>
      </button>
    </div>
  );
}
