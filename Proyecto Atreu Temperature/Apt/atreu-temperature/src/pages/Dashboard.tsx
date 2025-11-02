// src/pages/Dashboard.tsx
import { useMemo, useState } from "react";
import TunnelCardRect from "../components/TunnelCardRect";
import TunnelDetail from "../components/TunnelDetail";
import useNewAlarms from "../hooks/useNewAlarms";
import Footer from "../components/Footer";
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
  const [showAlarms, setShowAlarms] = useState(false);
  const [showAllAlarms, setShowAllAlarms] = useState(false);

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
    <div className="min-h-screen app-bg flex flex-col">{/* Cambiado a flex para el footer */}

      <div className="flex-1 mx-auto w-full max-w-[1920px] container-padding py-4 sm:py-6">{/* flex-1 para que tome el espacio disponible */}
        
        {/* Header mejorado */}
        <div className="glass-dark rounded-2xl p-6 mb-6 border border-border-medium shadow-soft">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2">
                Control de Temperatura
              </h1>
              <p className="text-brand-200 text-lg">
                Monitoreo en tiempo real - Sistema La Hornilla
              </p>
            </div>

            {/* Stats principales */}
            <div className="flex flex-wrap gap-3 relative">
              <div className="badge badge-brand text-sm px-4 py-2">
                <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></span>
                {loading && tunnels.length === 0 ? "Cargando..." : `${tunnels.length} Túneles`}
              </div>
              
              {/* Badge de Alertas Clickeable */}
              <button
                onClick={() => setShowAlarms(!showAlarms)}
                className={`relative badge text-sm px-4 py-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  showAlarms 
                    ? 'badge-error border-2' 
                    : alerts.length > 0 ? 'badge-warning hover:badge-error' : 'badge-success hover:badge-brand'
                }`}
                title="Click para ver alarmas"
              >
                <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
                {alerts.length} Alertas
                {newAlarms.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-white"></span>
                )}
              </button>
              
              {error && (
                <div className="badge badge-error text-sm px-4 py-2">
                  <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
                  Sin Conexión
                </div>
              )}


            </div>
          </div>
        </div>

        {/* Ventana Flotante de Alarmas */}
        {showAlarms && (
          <div className="fixed top-4 right-4 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] z-50 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden">
              
              {/* Header del modal */}
              <div className="flex items-center justify-between p-3 border-b border-slate-600/50 bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    newAlarms.length > 0 ? "bg-red-500 animate-pulse" : alerts.length > 0 ? "bg-orange-500" : "bg-green-500"
                  }`}></div>
                  <h3 className="font-semibold text-white text-sm">
                    {alerts.length === 0 
                      ? "Sin Alarmas" 
                      : `${alerts.length} Alarma${alerts.length === 1 ? '' : 's'}`
                    }
                  </h3>
                </div>
                <button
                  onClick={() => setShowAlarms(false)}
                  className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                  title="Cerrar ventana"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-sm font-medium text-white mb-1">¡Todo en Orden!</div>
                    <div className="text-xs text-slate-400">No hay alarmas activas</div>
                  </div>
                ) : (
                  <>
                    {/* Controles compactos */}
                    <div className="flex gap-1 mb-3">
                      <button
                        onClick={() => setShowAllAlarms(!showAllAlarms)}
                        className="flex-1 text-xs font-medium rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white px-2 py-1.5 border border-slate-600 hover:border-slate-500 transition-all duration-200"
                      >
                        {showAllAlarms ? `Nuevas (${newAlarms.length})` : `Todas (${alerts.length})`}
                      </button>
                      <button
                        onClick={() => { clearAll(); setShowAlarms(false); }}
                        className="text-xs font-medium rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-200 hover:text-white px-2 py-1.5 border border-red-500/30 hover:border-red-500/50 transition-all duration-200"
                      >
                        Cerrar Todo
                      </button>
                    </div>

                    {/* Lista de alarmas scrolleable */}
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                      {(showAllAlarms ? alerts : newAlarms).map((a) => (
                        <div
                          key={a.id}
                          className={`rounded-lg border p-2.5 transition-colors ${
                            a.status === "alarm" 
                              ? "border-red-500/30 bg-red-950/30 hover:bg-red-950/40" 
                              : "border-orange-500/30 bg-orange-950/30 hover:bg-orange-950/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white text-sm">
                                Túnel {a.tunnel}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                a.status === "alarm" 
                                  ? "bg-red-500/20 text-red-200" 
                                  : "bg-orange-500/20 text-orange-200"
                              }`}>
                                {a.status === "alarm" ? "ALARM" : "WARN"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-slate-300 mb-2 space-y-0.5">
                            <div className="flex justify-between">
                              <span><strong>Sensor:</strong> {a.sensor}</span>
                            </div>
                            <div className="flex justify-between">
                              <span><strong>Valor:</strong></span>
                              <span className={`font-mono font-bold ${
                                a.status === "alarm" ? "text-red-300" : "text-orange-300"
                              }`}>
                                {a.value === "OUT" ? "OUT" : `${a.value}°C`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span><strong>Fruta:</strong></span>
                              <span className="text-green-300">{a.fruit}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <button
                              onClick={() => dismiss(a.id)}
                              className="text-xs font-medium rounded bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white px-2 py-1 border border-slate-600 hover:border-slate-500 transition-all duration-200"
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Mensajes cuando no hay alarmas del tipo seleccionado */}
                      {!showAllAlarms && newAlarms.length === 0 && alerts.length > 0 && (
                        <div className="text-center py-4 text-slate-400">
                          <div className="text-xl mb-1">🔔</div>
                          <div className="text-xs font-medium text-white mb-0.5">No hay alarmas nuevas</div>
                          <div className="text-xs">Cambia a "Todas" para verlas</div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Grid de túneles mejorado */}
        {tunnels.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">Túneles de Refrigeración</h2>
              <div className="h-px bg-gradient-to-r from-brand-400/50 to-transparent flex-1"></div>
            </div>
            
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {tunnels.map((t) => (
                <div key={t.id} className="card-hover">
                  <TunnelCardRect
                    id={t.id}
                    fruta={t.fruit}
                    sensores={t.sensors}
                    onClick={() => setSelected(t.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cámaras mejoradas */}
        <section className="glass-dark rounded-2xl p-6 border border-border-medium">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-white">Cámaras de Ambiente</h2>
            <div className="h-px bg-gradient-to-r from-brand-400/50 to-transparent flex-1"></div>
            <span className="text-sm text-brand-300">Tiempo real</span>
          </div>
          
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {cameras.map((c) => (
              <div
                key={c.id}
                className="group card rounded-xl border border-border-subtle px-3 sm:px-4 py-3 sm:py-4 hover:border-brand-500/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm text-text-secondary group-hover:text-brand-300 transition-colors">
                      Cám {c.id}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold px-2 py-1 rounded-lg bg-brand-600/20 text-brand-300 border border-brand-600/30">
                    {c.temp}°C
                  </span>
                </div>
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

      {/* Footer simple */}
      <Footer />
    </div>
  );
}
