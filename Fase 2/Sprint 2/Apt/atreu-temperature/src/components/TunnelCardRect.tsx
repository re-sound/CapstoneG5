import React from "react";
import { TUNELES_MOCK } from "../data/tunnelMock";

/**
 * Tarjeta “angosta” estilo bosquejo:
 * - Marco exterior (tarjeta)
 * - Panel interior con tubo/ventiladores
 * - Ambiente (arriba) / Retorno (debajo)
 * - 4 sensores de entrada + 4 de salida
 *
 * Props:
 *  id: número de túnel
 *  fruta: etiqueta (CEREZA/UVA/CLEMENTINA)
 *  onClick: abrir modal detalle
 */
export default function TunnelCardRect({
  id,
  fruta,
  onClick,
}: {
  id: number;
  fruta: string;
  onClick?: () => void;
}) {
  const tun = TUNELES_MOCK.find((t) => t.id === id)!;

  // Mapeo rápido de 8 sensores en orden del bosquejo
  const IZQ_EXT_ENT = tun.sensores.PULP_1; // puedes re-mapear a tu gusto
  const IZQ_INT_ENT = tun.sensores.PULP_2;
  const DER_INT_ENT = tun.sensores.PULP_3;
  const DER_EXT_ENT = tun.sensores.PULP_4;

  const IZQ_EXT_SAL = "OUT"; // si no tienes, deja OUT o simula
  const IZQ_INT_SAL = "OUT";
  const DER_INT_SAL = "OUT";
  const DER_EXT_SAL = "OUT";

  const AMB_OUT = tun.sensores.AMB_OUT;
  const AMB_RET = tun.sensores.AMB_RET;

  const Chip = ({ children }: { children: React.ReactNode }) => (
    <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-700/40 border border-emerald-500/40 text-emerald-100 shadow-inner">
      {children}
    </span>
  );

  const Small = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] text-slate-300">{children}</span>
  );

  const Val = ({ v }: { v: number | "OUT" }) => (
    <Chip>{typeof v === "number" ? `${v}°C` : "OUT"}</Chip>
  );

  return (
    <button
      onClick={onClick}
      className="group relative w-full max-w-[520px] mx-auto rounded-2xl border border-[var(--cardBorder)] bg-[var(--cardBg)]/70 hover:bg-[var(--cardBg)] transition-colors text-left"
    >
      {/* Encabezado compacto */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="text-[13px] font-semibold text-slate-200">Túnel {id}</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-[2px] rounded-full bg-emerald-700/35 border border-emerald-500/30 text-emerald-100">
            Disponible
          </span>
          <span className="text-[10px] px-2 py-[2px] rounded-full bg-sky-700/35 border border-sky-500/30 text-sky-100">
            {fruta}
          </span>
        </div>
      </div>

      {/* Panel interior (papel del bosquejo) */}
      <div className="mt-2 px-3 pb-3">
        <div className="rounded-xl border border-[var(--panelBorder)] bg-[var(--panelBg)]/70 p-3">
          {/* Tubo superior */}
          <div className="relative">
            <div className="h-1.5 rounded-full bg-pink-500/70 shadow-[0_0_16px_#e11d48]"></div>
            {/* Ambiente/Retorno apilados y centrados */}
            <div className="w-full flex flex-col items-center gap-1 -mt-3">
              <div className="flex flex-col items-center">
                <Small>Ambiente</Small>
                <span className="text-[10px] px-2 py-[1px] rounded bg-slate-800/70 border border-slate-600 text-slate-100">
                  {typeof AMB_OUT === "number" ? `${AMB_OUT}°C` : "OUT"}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <Small>Retorno</Small>
                <span className="text-[10px] px-2 py-[1px] rounded bg-slate-800/70 border border-slate-600 text-slate-100">
                  {typeof AMB_RET === "number" ? `${AMB_RET}°C` : "OUT"}
                </span>
              </div>
            </div>
          </div>

          {/* Fila de ENTRADA */}
          <div className="grid grid-cols-4 gap-3 mt-5 text-center">
            <div>
              <Val v={IZQ_EXT_ENT} />
              <div className="mt-1">
                <Small>EXT. IZQ, ENTRADA</Small>
              </div>
            </div>
            <div>
              <Val v={IZQ_INT_ENT} />
              <div className="mt-1">
                <Small>INT. IZQ, ENTRADA</Small>
              </div>
            </div>
            <div>
              <Val v={DER_INT_ENT} />
              <div className="mt-1">
                <Small>INT. DER, ENTRADA</Small>
              </div>
            </div>
            <div>
              <Val v={DER_EXT_ENT} />
              <div className="mt-1">
                <Small>EXT. DER, ENTRADA</Small>
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="my-3 h-[2px] bg-slate-600/30 rounded-full"></div>

          {/* Fila de SALIDA */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <Val v={IZQ_EXT_SAL as any} />
              <div className="mt-1">
                <Small>EXT. IZQ, SALIDA</Small>
              </div>
            </div>
            <div>
              <Val v={IZQ_INT_SAL as any} />
              <div className="mt-1">
                <Small>INT. IZQ, SALIDA</Small>
              </div>
            </div>
            <div>
              <Val v={DER_INT_SAL as any} />
              <div className="mt-1">
                <Small>INT. DER, SALIDA</Small>
              </div>
            </div>
            <div>
              <Val v={DER_EXT_SAL as any} />
              <div className="mt-1">
                <Small>EXT. DER, SALIDA</Small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
