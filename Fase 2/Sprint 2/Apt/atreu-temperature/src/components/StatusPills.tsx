// src/components/StatusPills.tsx
import { useSyncExternalStore } from "react";
import { getProcess, subscribe, ProcessStatus } from "../state/processStore";

function pill(kind: ProcessStatus) {
  if (kind === "running") return "bg-emerald-600 text-white";
  if (kind === "paused") return "bg-amber-600 text-white";
  if (kind === "finished") return "bg-slate-600 text-white";
  return "bg-emerald-600 text-white"; // idle -> Disponible
}

export default function StatusPills({ tunnelId }: { tunnelId: number }) {
  const process = useSyncExternalStore(
    subscribe,
    () => getProcess(tunnelId),
    () => getProcess(tunnelId)
  );

  if (process.status === "idle") {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded ${pill("idle")}`}>Disponible</span>
      </div>
    );
  }

  if (process.status === "running" || process.status === "paused") {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded ${pill(process.status)}`}>
          {process.status === "running" ? "En ejecución" : "Pausado"}
        </span>
        <span className="text-xs px-2 py-1 rounded bg-sky-700 text-white">
          {process.fruit}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2 py-1 rounded ${pill("finished")}`}>Finalizado</span>
    </div>
  );
}
