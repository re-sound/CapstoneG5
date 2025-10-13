// src/components/AlarmCenter.tsx
import { useState } from "react";
import type { AlertItem } from "../hooks/useAlerts";

export default function AlarmCenter({
  allAlerts,
  newAlarms,
  onDismiss,
  onClearAll,
}: {
  allAlerts: AlertItem[];
  newAlarms: AlertItem[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="fixed top-20 right-2 sm:right-3 md:top-4 md:right-6 lg:right-8 xl:right-12 z-50">
      {/* Botón campana - posición fija */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative group rounded-lg md:rounded-xl border px-2 py-2 sm:px-3 sm:py-2 md:px-3 md:py-2 lg:px-4 lg:py-3 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
          open 
            ? "border-green-500 bg-green-900/20 text-white" 
            : "border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-100 hover:text-white"
        }`}
        aria-label="Ver alarmas"
      >
        <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2">
          <div className="text-sm md:text-base lg:text-lg">{open ? "🔔" : "🔕"}</div>
          <span className="text-xs md:text-xs lg:text-sm font-medium hidden xl:inline">Alarmas</span>
        </div>
        {(allAlerts.length > 0 || newAlarms.length > 0) && (
          <span className={`absolute -top-1 -right-1 md:-top-2 md:-right-2 text-[10px] md:text-xs rounded-full px-1.5 py-0.5 md:px-2 md:py-1 font-bold shadow-lg ${
            newAlarms.length > 0 
              ? "bg-red-500 text-white animate-pulse" 
              : "bg-orange-500 text-white"
          }`}>
            {newAlarms.length > 0 ? newAlarms.length : allAlerts.length}
          </span>
        )}
      </button>

      {/* Panel - se abre hacia la izquierda */}
      {open && (allAlerts.length > 0 || newAlarms.length > 0) && (
        <div className="absolute top-full right-0 mt-3 w-[280px] sm:w-[320px] md:w-[360px] lg:w-[400px] max-w-[90vw] rounded-xl border border-slate-600/50 bg-slate-900/95 backdrop-blur-sm p-3 sm:p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                newAlarms.length > 0 ? "bg-red-500 animate-pulse" : "bg-orange-500"
              }`}></div>
              <div className="font-semibold text-white">
                {newAlarms.length > 0 ? "Alarmas Nuevas" : "Todas las Alarmas"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-medium rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white px-3 py-1.5 border border-slate-600 hover:border-slate-500 transition-all duration-200"
              >
                {showAll ? "Solo Nuevas" : "Ver Todas"}
              </button>
              <button
                onClick={onClearAll}
                className="text-xs font-medium rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-200 hover:text-white px-3 py-1.5 border border-red-500/30 hover:border-red-500/50 transition-all duration-200"
              >
                Cerrar todo
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
            {(showAll ? allAlerts : newAlarms).map((a) => (
              <div
                key={a.id}
                className={`rounded-lg border p-3 transition-colors ${
                  a.status === "alarm" 
                    ? "border-red-500/30 bg-red-950/30 hover:bg-red-950/40" 
                    : "border-orange-500/30 bg-orange-950/30 hover:bg-orange-950/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">
                      Túnel {a.tunnel}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                      a.status === "alarm" 
                        ? "bg-red-500/20 text-red-200" 
                        : "bg-orange-500/20 text-orange-200"
                    }`}>
                      {a.status === "alarm" ? "ALARMA" : "ADVERTENCIA"}
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {a.sensor}
                  </div>
                </div>
                <div className="text-xs text-slate-300 mb-2">
                  <span className={`font-mono ${
                    a.status === "alarm" ? "text-red-200" : "text-orange-200"
                  }`}>
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
            {showAll && allAlerts.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-sm">No hay alarmas activas</div>
              </div>
            )}
            {!showAll && newAlarms.length === 0 && allAlerts.length > 0 && (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">🔔</div>
                <div className="text-sm">No hay alarmas nuevas</div>
                <div className="text-xs mt-1">Haz clic en "Ver Todas" para ver alarmas existentes</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
