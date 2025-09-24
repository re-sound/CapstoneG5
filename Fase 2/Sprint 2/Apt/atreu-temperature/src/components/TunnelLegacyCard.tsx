// src/components/TunnelLegacyCard.tsx
import React from "react";
import { TUNELES_MOCK } from "../data/tunnelMock";

export type LegacyCardData = {
  id: number;
  fruta: "CEREZA" | "UVA" | "CLEMENTINA" | "GENÉRICA";
  status: "Disponible" | "En Ejecución" | "Libre";
  ambOut: number | "OUT";
  ambRet: number | "OUT";
  // Solo 4 sensores de ENTRADA
  izqExtEnt: number | "OUT";
  izqIntEnt: number | "OUT";
  derIntEnt: number | "OUT";
  derExtEnt: number | "OUT";
  tick?: number;
};

export function mapFromMock(id: number): LegacyCardData {
  const t = TUNELES_MOCK.find((x) => x.id === id)!;

  // Ajusta aquí el mapeo desde tus PULP_X:
  // Suponemos:
  //   PULP_1 -> IZQ EXT ENT
  //   PULP_2 -> IZQ INT ENT
  //   PULP_3 -> DER INT ENT
  //   PULP_4 -> DER EXT ENT
  const s = t.sensores;
  return {
    id: t.id,
    fruta: t.fruta,
    status: "Disponible",
    ambOut: s.AMB_OUT,
    ambRet: s.AMB_RET,
    izqExtEnt: s.PULP_1,
    izqIntEnt: s.PULP_2,
    derIntEnt: s.PULP_3,
    derExtEnt: s.PULP_4,
    tick: undefined,
  };
}

function Chip({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: number | "OUT";
  align?: "left" | "right" | "center";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium";
  const color =
    typeof value === "number"
      ? "bg-emerald-700/25 text-emerald-200 ring-1 ring-emerald-500/30"
      : "bg-slate-700/30 text-slate-300 ring-1 ring-slate-600/40";
  const pos =
    align === "left"
      ? "justify-start"
      : align === "right"
      ? "justify-end"
      : "justify-center";

  return (
    <div className={`${base} ${color} ${pos} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]`}>
      <span className="opacity-80">{label}</span>
      <span className="text-white">{typeof value === "number" ? `${value}°C` : "OUT"}</span>
    </div>
  );
}

export default function TunnelLegacyCard({
  data,
  onClick,
}: {
  data: LegacyCardData;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-xl border border-border/70 bg-card/70 hover:bg-card/90 transition shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand/50"
    >
      {/* Header */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-on/80 text-sm">{`Túnel ${data.id}`}</span>
          <span className="text-[11px] px-2 py-1 rounded bg-brand/90 text-white shadow">
            {data.fruta}
          </span>
        </div>
      </div>

      {/* Banda de estado */}
      <div className="px-4 mt-3">
        <div className="w-full rounded-md bg-emerald-600 text-white text-[12px] px-3 py-1 shadow-sm">
          {data.status}
        </div>
      </div>

      {/* Cuerpo del túnel */}
      <div className="p-4">
        <div className="rounded-2xl border border-border/50 bg-slate-900/40 px-3 py-4">
          {/* marco interior */}
          <div className="rounded-2xl border border-border/40 bg-slate-900/40 p-3 relative overflow-hidden">
            {/* barra ventiladores */}
            <div className="absolute left-8 right-8 top-4 h-1 bg-rose-500/50 shadow-[0_0_12px_2px_rgba(244,63,94,0.5)] rounded-full" />
            {/* chip ambiente arriba */}
            <div className="w-full flex items-center justify-center mb-8">
              <div className="rounded-md bg-slate-800/80 text-slate-100 text-[12px] px-2 py-1 ring-1 ring-slate-700/60">
                AmbE
              </div>
              <div className="ml-2 text-[12px] text-slate-200">
                {typeof data.ambOut === "number" ? `${data.ambOut}°C` : "OUT"}
              </div>
            </div>

            {/* grilla de sensores de ENTRADA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Chip label="IZQ EXT ENT" value={data.izqExtEnt} align="left" />
              <Chip label="DER INT ENT" value={data.derIntEnt} align="right" />
              <Chip label="IZQ INT ENT" value={data.izqIntEnt} align="left" />
              <Chip label="DER EXT ENT" value={data.derExtEnt} align="right" />
            </div>

            {/* línea base del túnel */}
            <div className="mt-6 mx-6 h-1 rounded-full bg-slate-700/40" />

            {/* Retorno abajo */}
            <div className="w-full flex items-center justify-center mt-4">
              <div className="rounded-md bg-slate-800/80 text-slate-100 text-[12px] px-2 py-1 ring-1 ring-slate-700/60">
                AmbS
              </div>
              <div className="ml-2 text-[12px] text-slate-200">
                {typeof data.ambRet === "number" ? `${data.ambRet}°C` : "OUT"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
