// src/components/AlarmCenter.tsx
import { useState } from "react";
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
        className="relative group rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 px-4 py-3 text-slate-100 hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
        aria-label="Alarmas nuevas"
      >
        <div className="flex items-center gap-2">
          <div className="text-lg">🔔</div>
          <span className="text-sm font-medium">Alarmas</span>
        </div>
        {newAlarms.length > 0 && (
          <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white rounded-full px-2 py-1 font-bold shadow-lg animate-pulse">
            {newAlarms.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && newAlarms.length > 0 && (
        <div className="mt-3 w-[380px] max-w-[90vw] rounded-xl border border-red-500/30 bg-slate-900/95 backdrop-blur-sm p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="font-semibold text-red-200">Alarmas Activas</div>
            </div>
            <button
              onClick={onClearAll}
              className="text-xs font-medium rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-200 hover:text-white px-3 py-1.5 border border-red-500/30 hover:border-red-500/50 transition-all duration-200"
            >
              Cerrar todo
            </button>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
            {newAlarms.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-red-500/30 bg-red-950/30 p-3 hover:bg-red-950/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-white">
                    Túnel {a.tunnel}
                  </div>
                  <div className="text-xs text-red-300 font-medium">
                    {a.sensor}
                  </div>
                </div>
                <div className="text-xs text-slate-300 mb-2">
                  <span className="font-mono text-red-200">
                    {a.value === "OUT" ? "OUT" : `${a.value}°C`}
                  </span>
                  <span className="mx-2">•</span>
                  <span className="text-green-300">{a.fruit}</span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => onDismiss(a.id)}
                    className="text-xs font-medium rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white px-3 py-1.5 border border-slate-600 hover:border-slate-500 transition-all duration-200"
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
