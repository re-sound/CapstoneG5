// src/hooks/useProcessActionsDebug.ts
import { apiStartProcess, apiFinalizeProcess } from "../api/client";
import * as processStore from "../state/processStore";

/**
 * Hook de debug para verificar que las funciones se exporten correctamente
 */
export function useProcessActionsDebug() {
  
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
    console.log('🔄 Iniciando proceso en backend...', { tunnelId, payload });
    
    try {
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

  const finalizeProcessAction = async (tunnelId: number, endedBy: string) => {
    console.log('🏁 Finalizando proceso en backend...', { tunnelId, endedBy });
    
    try {
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

  // Retornar un objeto con las funciones
  return {
    startProcessAction: startProcessAction,
    finalizeProcessAction: finalizeProcessAction
  };
}
