// src/components/AlarmCenter.tsx
import React, { useState } from "react";
import type { AlertItem } from "../hooks/useAlerts";

export default function AlarmCenter({
  newAlarms,
  onDismiss,
  onClearAll,
}: {
  newAlarms: AlertItem[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Botón campana */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100 hover:bg-slate-900"
        aria-label="Alarmas nuevas"
      >
        🔔
        {newAlarms.length > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] bg-rose-600 text-white rounded-full px-1.5 py-[1px]">
            {newAlarms.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && newAlarms.length > 0 && (
        <div className="mt-2 w-[360px] max-w-[90vw] rounded-xl border border-rose-700/50 bg-slate-900/90 backdrop-blur p-3 shadow-2xl">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-rose-200">Alarmas nuevas</div>
            <button
              onClick={onClearAll}
              className="text-xs rounded bg-slate-800 hover:bg-slate-700 px-2 py-1"
            >
              Cerrar todo
            </button>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
            {newAlarms.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-rose-700/40 bg-rose-950/40 p-2"
              >
                <div className="text-sm">
                  <span className="font-semibold">Túnel {a.tunnel}</span>{" "}
                  — <span className="text-rose-300">{a.sensor}</span>
                </div>
                <div className="text-[12px] text-slate-300">
                  Valor:{" "}
                  <span className="font-mono">
                    {a.value === "OUT" ? "OUT" : `${a.value}°C`}
                  </span>{" "}
                  • Fruta: {a.fruit}
                </div>
                <div className="mt-1 flex justify-end">
                  <button
                    onClick={() => onDismiss(a.id)}
                    className="text-xs rounded bg-slate-800 hover:bg-slate-700 px-2 py-1"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
