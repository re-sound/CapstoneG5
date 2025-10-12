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

const pageVars =
  "[@supports(color:oklab(0%_0_0))]:[color-scheme:dark] " +
  "[--bg:#0c1114] [--cardBg:#0f1518] [--cardBorder:#1e2a22] " +
  "[--panelBg:#0b1316] [--panelBorder:#203229] " +
  "[--accent:#6db33f] [--accent2:#2bb673]";

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
    <div className={`${pageVars} min-h-screen bg-[var(--bg)] text-slate-100`}>
      {/* Panel flotante de alarmas */}
      <AlarmCenter newAlarms={newAlarms} onDismiss={dismiss} onClearAll={clearAll} />

      <div className="mx-auto w-full max-w-[1920px] px-5 py-6">
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">
          Temperaturas
        </h1>
        <div className="mb-2 text-sm text-slate-400">
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
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">Cargando datos del servidor...</div>
          </div>
        )}

        {/* Grid de túneles */}
        {tunnels.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Cámaras</h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
            {cameras.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-[var(--cardBorder)] bg-[var(--cardBg)]/80 px-4 py-3"
              >
                <span className="text-sm text-slate-200">Cámara {c.id}</span>
                <span className="text-[12px] px-2 py-1 rounded-full bg-emerald-800/40 border border-emerald-600/40 text-emerald-100">
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
