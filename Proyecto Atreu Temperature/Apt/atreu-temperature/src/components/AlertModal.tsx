import React from "react";
import { X } from "lucide-react";
import { AlertItem } from "../hooks/useAlerts";
import { sensorLabel } from "../utils/labels";

export default function AlertModal({
  items,
  onClose,
  onCloseOne,
}: {
  items: AlertItem[];
  onClose: () => void;
  onCloseOne: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-3">
      <div className="w-full max-w-lg rounded-2xl bg-card text-on shadow-2xl ring-1 ring-white/10 focus-brand">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="font-semibold text-red-300">⚠️ Alarmas detectadas</div>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto p-4 grid gap-3">
          {items.map((a) => (
            <div key={a.id} className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <div className="text-sm">
                <span className="font-semibold">Túnel {a.tunnel}</span>{" · "}
                <span className="opacity-80">{a.fruit}</span>
              </div>
              <div className="mt-1 text-sm">
                <span className="opacity-80">Sensor:</span>{" "}
                <span className="font-medium">{sensorLabel(a.sensor as any)}</span>
              </div>
              <div className="mt-0.5 text-sm">
                <span className="opacity-80">Lectura:</span>{" "}
                <span className="font-medium">
                  {a.value === "OUT" ? "SIN SEÑAL (OUT)" : `${a.value}°C`}
                </span>
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => onCloseOne(a.id)}
                  className="rounded-lg bg-card hover:bg-slate-700 px-3 py-1.5 text-sm focus-brand"
                >
                  Aceptar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-1.5 text-sm text-white"
          >
            Cerrar todo
          </button>
        </div>
      </div>
    </div>
  );
}
