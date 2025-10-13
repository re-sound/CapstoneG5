// src/pages/Dashboard.tsx
import { useMemo, useState } from "react";
import TunnelCardRect from "../components/TunnelCardRect";
import TunnelDetail from "../components/TunnelDetail";
import useNewAlarms from "../hooks/useNewAlarms";
import AlarmCenter from "../components/AlarmCenter";
import { usePolling } from "../hooks/usePolling";
import { useProcessSync } from "../hooks/useProcessSync";
import { apiGetTunnels, type TunnelDto } from "../api/client";
import type { Fruit } from "../types";

// Variables CSS unificadas - ahora se usan desde index.css

// Tipo adaptado para el Dashboard
type TunnelData = {
  id: number;
  fruit: Fruit;
  sensors: {
    AMB_OUT: number | "OUT";
    AMB_RET: number | "OUT";
    PULP_1: number | "OUT";
    PULP_2: number | "OUT";
    PULP_3: number | "OUT";
    PULP_4: number | "OUT";
  };
};

export default function Dashboard() {
  const [selected, setSelected] = useState<number | null>(null);

  // 🔌 Sincronización de procesos con el backend
  useProcessSync(5000); // Sincroniza procesos cada 5 segundos

  // 🔌 Polling de túneles desde el backend cada 5 segundos
  const { data: tunnelsData, error, loading } = usePolling<TunnelDto[]>(
    apiGetTunnels,
    5000, // 5 segundos
    []
  );

  // Transformar datos del API al formato esperado por los componentes
  const tunnels = useMemo<TunnelData[]>(() => {
    if (!tunnelsData || tunnelsData.length === 0) return [];
    
    return tunnelsData.map((t) => ({
      id: t.id,
      fruit: t.fruit as Fruit,
      sensors: t.sensors || {
        AMB_OUT: "OUT",
        AMB_RET: "OUT",
        PULP_1: "OUT",
        PULP_2: "OUT",
        PULP_3: "OUT",
        PULP_4: "OUT",
      },
    }));
  }, [tunnelsData]);

  // Hook de alarmas (datos reales del backend)
  const alarmsInput = useMemo(
    () =>
      tunnels.map((t) => ({
        id: t.id,
        fruit: t.fruit,
        sensors: t.sensors,
      })),
    [tunnels]
  );
  const { alerts, newAlarms, dismiss, clearAll } = useNewAlarms(alarmsInput);

  // Obtener la fruta del túnel seleccionado
  const selectedTunnel = useMemo(
    () => tunnels.find((t) => t.id === selected),
    [tunnels, selected]
  );

  // Cámaras simuladas (generadas a partir de los túneles)
  const cameras = useMemo(() => {
    // Generar temperaturas aleatorias para 8 cámaras basándose en los datos actuales
    return Array.from({ length: 8 }, (_, i) => {
      // Usar datos de túneles si existen, sino generar valor aleatorio
      const baseTunnel = tunnels[i % tunnels.length];
      let temp = 4.5; // temperatura por defecto
      
      if (baseTunnel && baseTunnel.sensors.AMB_OUT !== "OUT") {
        // Usar temperatura ambiente del túnel como base
        temp = baseTunnel.sensors.AMB_OUT + (Math.random() - 0.5) * 0.8;
      } else {
        // Generar temperatura aleatoria entre 4-5°C
        temp = 4 + Math.random() * 1;
      }
      
      return {
        id: i + 1,
        temp: +temp.toFixed(1),
      };
    });
  }, [tunnels]);

  return (
    <div className="min-h-screen app-bg">
      {/* Panel flotante de alarmas */}
      <AlarmCenter 
        allAlerts={alerts} 
        newAlarms={newAlarms} 
        onDismiss={dismiss} 
        onClearAll={clearAll} 
      />

      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-5 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 sm:mb-6 text-white">
          Temperaturas
        </h1>
        <div className="mb-2 text-xs sm:text-sm text-green-200">
          {loading && tunnels.length === 0 ? "Cargando..." : `${tunnels.length} túneles activos`} • {alerts.length} alertas totales
          {error && <span className="ml-2 text-red-400">• Error de conexión</span>}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
            <strong>Error:</strong> No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:4000
          </div>
        )}

        {/* Estado de carga inicial */}
        {loading && tunnels.length === 0 && !error && (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <div className="text-slate-400 text-sm sm:text-base">Cargando datos del servidor...</div>
          </div>
        )}

        {/* Grid de túneles */}
        {tunnels.length > 0 && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {tunnels.map((t) => (
              <TunnelCardRect
                key={t.id}
                id={t.id}
                fruta={t.fruit}
                sensores={t.sensors}
                onClick={() => setSelected(t.id)}
              />
            ))}
          </div>
        )}

        {/* Cámaras */}
        <section className="mt-6 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 text-white">Cámaras</h2>
          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {cameras.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg sm:rounded-xl border border-slate-700 bg-slate-900/80 px-3 sm:px-4 py-2 sm:py-3 hover:bg-slate-900 transition-colors"
              >
                <span className="text-xs sm:text-sm text-green-200">Cám {c.id}</span>
                <span className="text-[10px] sm:text-[12px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-green-800/40 border border-green-600/40 text-green-100">
                  {c.temp}°C
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal detalle */}
      {selected && selectedTunnel && (
        <TunnelDetail
          tunnelId={selected}
          open={true}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
