// src/hooks/useProcessSync.ts
import { useEffect } from "react";
import { usePolling } from "./usePolling";
import { apiGetAllProcesses, type ProcessDto } from "../api/client";
import * as processStore from "../state/processStore";

/**
 * Hook para sincronizar procesos del backend con el processStore local
 * Hace polling cada X segundos y actualiza el store
 */
export function useProcessSync(intervalMs = 5000) {
  const { data: processes } = usePolling<ProcessDto[]>(
    apiGetAllProcesses,
    intervalMs,
    []
  );

  useEffect(() => {
    if (!processes || processes.length === 0) return;

    // Sincronizar cada proceso con el store local
    processes.forEach((proc) => {
      const localProc = processStore.getProcess(proc.tunnel_id);
      
      // Convertir del formato backend al formato frontend
      const ranges = {
        min: proc.min_temp,
        max: proc.max_temp,
        idealMin: proc.ideal_min,
        idealMax: proc.ideal_max,
      };

      // Si el proceso del backend está activo (running/paused)
      if (proc.status === "running" || proc.status === "paused") {
        // Actualizar el store local con los datos del backend
        if (!localProc || localProc.status === "idle" || localProc.status === "finished") {
          // El proceso se inició en el backend, iniciarlo en el frontend
          processStore.startProcess(proc.tunnel_id, {
            fruit: proc.fruit as processStore.Fruit,
            ranges,
            startedBy: proc.started_by,
            startedAt: proc.started_at,
            measurePlan: proc.measure_plan as processStore.MeasurePlan,
            destination: proc.destination,
            origin: proc.origin,
            conditionInitial: proc.condition_initial,
          });
          
          // Si está pausado, pausarlo también en el frontend y actualizar timestamps
          if (proc.status === "paused") {
            processStore.pauseProcess(proc.tunnel_id);
            // Actualizar timestamp de pausa si existe
            if (proc.paused_at) {
              processStore.updateProcessInfo(proc.tunnel_id, { pausedAt: proc.paused_at });
            }
          }
          
          // Actualizar timestamp de reanudación si existe
          if (proc.resumed_at) {
            processStore.updateProcessInfo(proc.tunnel_id, { resumedAt: proc.resumed_at });
          }
        } else {
          // El proceso ya existe, solo actualizar rangos si cambiaron
          if (
            localProc.ranges.min !== ranges.min ||
            localProc.ranges.max !== ranges.max ||
            localProc.ranges.idealMin !== ranges.idealMin ||
            localProc.ranges.idealMax !== ranges.idealMax
          ) {
            processStore.updateRanges(proc.tunnel_id, ranges);
          }
          
          // Sincronizar estado paused/running y timestamps
          if (proc.status === "paused" && localProc.status === "running") {
            processStore.pauseProcess(proc.tunnel_id);
            if (proc.paused_at) {
              processStore.updateProcessInfo(proc.tunnel_id, { pausedAt: proc.paused_at });
            }
          } else if (proc.status === "running" && localProc.status === "paused") {
            processStore.resumeProcess(proc.tunnel_id);
            if (proc.resumed_at) {
              processStore.updateProcessInfo(proc.tunnel_id, { resumedAt: proc.resumed_at });
            }
          }
          
          // Actualizar timestamps si cambiaron
          if (proc.paused_at && localProc.pausedAt !== proc.paused_at) {
            processStore.updateProcessInfo(proc.tunnel_id, { pausedAt: proc.paused_at });
          }
          if (proc.resumed_at && localProc.resumedAt !== proc.resumed_at) {
            processStore.updateProcessInfo(proc.tunnel_id, { resumedAt: proc.resumed_at });
          }
        }
      } else if (proc.status === "idle" && localProc && localProc.status !== "idle") {
        // El proceso se finalizó en el backend, finalizarlo en el frontend
        processStore.finalizeProcess(proc.tunnel_id, proc.ended_by || "Sistema");
        
        // Actualizar timestamp de finalización si existe
        if (proc.finalized_at) {
          processStore.updateProcessInfo(proc.tunnel_id, { finalizedAt: proc.finalized_at });
        }
      }
    });
  }, [processes]);

  return { processes };
}

