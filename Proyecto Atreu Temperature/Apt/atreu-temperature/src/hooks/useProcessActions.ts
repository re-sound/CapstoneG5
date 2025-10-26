// src/hooks/useProcessActions.ts
import { apiStartProcess, apiPauseProcess, apiResumeProcess, apiFinalizeProcess } from "../api/client";
import * as processStore from "../state/processStore";

/**
 * Hook para manejar acciones de procesos que se sincronizan con el backend
 */
export function useProcessActions() {
  
  const startProcessAction = async (
    tunnelId: number,
    payload: {
      fruit: processStore.Fruit;
      ranges: processStore.Range;
      startedBy?: string;
      startedAt?: string;
      measurePlan?: processStore.MeasurePlan;
      destination?: string;
      conditionInitial?: string;
      origin?: string;
      description?: string;
    }
  ) => {
    try {
      console.log('🔄 Iniciando proceso en backend...', { tunnelId, payload });
      
      // Llamar a la API del backend
      const result = await apiStartProcess(tunnelId, {
        fruit: payload.fruit,
        min_temp: payload.ranges.min,
        max_temp: payload.ranges.max,
        ideal_min: payload.ranges.idealMin,
        ideal_max: payload.ranges.idealMax,
        measure_plan: payload.measurePlan,
        destination: payload.destination,
        origin: payload.origin,
        condition_initial: payload.conditionInitial,
        description: payload.description
      });

      console.log('✅ Proceso iniciado en backend:', result);

      // Actualizar el store local
      processStore.startProcess(tunnelId, payload);
      
    } catch (error) {
      console.error('❌ Error iniciando proceso:', error);
      throw error;
    }
  };

  const pauseProcessAction = async (tunnelId: number) => {
    try {
      console.log('⏸️ Pausando proceso en backend...', { tunnelId });
      
      // Llamar a la API del backend
      const result = await apiPauseProcess(tunnelId);
      
      console.log('✅ Proceso pausado en backend:', result);

      // Actualizar el store local
      processStore.pauseProcess(tunnelId);
      
    } catch (error) {
      console.error('❌ Error pausando proceso:', error);
      throw error;
    }
  };

  const resumeProcessAction = async (tunnelId: number) => {
    try {
      console.log('▶️ Reanudando proceso en backend...', { tunnelId });
      
      // Llamar a la API del backend
      const result = await apiResumeProcess(tunnelId);
      
      console.log('✅ Proceso reanudado en backend:', result);

      // Actualizar el store local
      processStore.resumeProcess(tunnelId);
      
    } catch (error) {
      console.error('❌ Error reanudando proceso:', error);
      throw error;
    }
  };

  const finalizeProcessAction = async (tunnelId: number, endedBy: string) => {
    try {
      console.log('🏁 Finalizando proceso en backend...', { tunnelId, endedBy });
      
      // Llamar a la API del backend
      const result = await apiFinalizeProcess(tunnelId, endedBy);
      
      console.log('✅ Proceso finalizado en backend:', result);

      // Actualizar el store local
      processStore.finalizeProcess(tunnelId, endedBy);
      
    } catch (error) {
      console.error('❌ Error finalizando proceso:', error);
      throw error;
    }
  };

  return {
    startProcessAction,
    pauseProcessAction,
    resumeProcessAction,
    finalizeProcessAction
  };
}