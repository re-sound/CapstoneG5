// src/components/TunnelCard.tsx
import React from "react";
import { Tunnel } from "../data/tunnelMock";

export default function TunnelCard({ tunnel }: { tunnel: Tunnel }) {
  const { id, fruta, sensores } = tunnel;

  return (
    <div className="border border-slate-700 rounded-xl p-3 bg-slate-900/50 hover:ring-2 hover:ring-sky-500 transition">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold">Túnel {id}</h2>
        <div className="flex gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-slate-700/60">{fruta}</span>
        </div>
      </div>

      {/* Contenedor reducido */}
      <div className="relative w-full h-40 bg-slate-800/40 rounded-lg flex items-center justify-center">
        {/* AMB OUT */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] bg-slate-700/80 text-white px-2 py-0.5 rounded">
          {sensores.AMB_OUT}°C
        </div>
        <div className="absolute top-5 left-[20%] right-[20%] h-1 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>

        {/* AMB RET */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] bg-slate-700/80 text-white px-2 py-0.5 rounded">
          {sensores.AMB_RET}°C
        </div>

        {/* IZQ EXT */}
        <div className="absolute left-1 top-[25%] bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded">
          IZQ EXT {sensores.IZQ_EXT}°C
        </div>
        {/* IZQ INT */}
        <div className="absolute left-1 bottom-[25%] bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded">
          IZQ INT {sensores.IZQ_INT}°C
        </div>

        {/* DER INT */}
        <div className="absolute right-1 top-[25%] bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded">
          DER INT {sensores.DER_INT}°C
        </div>
        {/* DER EXT */}
        <div className="absolute right-1 bottom-[25%] bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded">
          DER EXT {sensores.DER_EXT}°C
        </div>
      </div>
    </div>
  );
}
