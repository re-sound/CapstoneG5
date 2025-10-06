// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import TunnelCardRect from "../components/TunnelCardRect";
import TunnelDetail from "../components/TunnelDetail";
import useNewAlarms from "../hooks/useNewAlarms";
import AlarmCenter from "../components/AlarmCenter";

const pageVars =
  "[@supports(color:oklab(0%_0_0))]:[color-scheme:dark] " +
  "[--bg:#0c1114] [--cardBg:#0f1518] [--cardBorder:#1e2a22] " +
  "[--panelBg:#0b1316] [--panelBorder:#203229] " +
  "[--accent:#6db33f] [--accent2:#2bb673]";

type Fruit = "CEREZA" | "UVA" | "CLEMENTINA" | "GENÉRICA";

// Tipo base simulado
type TunnelSim = {
  id: number;
  fruit: Fruit;
  sensors: {
    AMB_OUT: number;
    AMB_RET: number;
    PULP_1: number;
    PULP_2: number;
    PULP_3: number;
    PULP_4: number;
  };
};

// --- función auxiliar para generar temperaturas ---
function generateSensorTemp(tick: number, base = 4.3) {
  // normalmente entre 4–5°C
  let value = base + Math.random() * 1;
  // cada 3 ticks, mete una lectura anómala
  if (tick % 3 === 0 && Math.random() < 0.4) {
    value = 15 + Math.random() * 2; // pico alto 15–17°C
  }
  return +value.toFixed(1);
}

export default function Dashboard() {
  const [selected, setSelected] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  // simulador cada 5 segundos
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(t);
  }, []);

  // 🔌 genera túneles simulados (como si vinieran del backend)
  const tunnels = useMemo<TunnelSim[]>(() => {
    const fruits: Fruit[] = ["CEREZA", "UVA", "CLEMENTINA", "GENÉRICA"];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      fruit: fruits[i % fruits.length],
      sensors: {
        AMB_OUT: generateSensorTemp(tick),
        AMB_RET: generateSensorTemp(tick),
        PULP_1: generateSensorTemp(tick),
        PULP_2: generateSensorTemp(tick),
        PULP_3: generateSensorTemp(tick),
        PULP_4: generateSensorTemp(tick),
      },
    }));
  }, [tick]);

  // Hook de alarmas (Tuneles Simulados)
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

  // Cámaras decorativas (también simuladas)
  const cameras = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        temp: generateSensorTemp(tick),
      })),
    [tick]
  );

  const tickRef = useRef(0);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  return (
    <div className={`${pageVars} min-h-screen bg-[var(--bg)] text-slate-100`}>
      {/* Panel flotante de alarmas */}
      <AlarmCenter newAlarms={newAlarms} onDismiss={dismiss} onClearAll={clearAll} />

      <div className="mx-auto w-full max-w-[1920px] px-5 py-6">
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">
          Temperaturas — Simulación de Prueba
        </h1>
        <div className="mb-2 text-sm text-slate-400">
          Tick #{tick} • {alerts.length} alertas totales
        </div>

        {/* Grid de túneles */}
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
      {selected && (
        <TunnelDetail
          tunnelId={selected}
          open={true}
          onClose={() => setSelected(null)}
          frutaActual={"CEREZA" as Fruit}
          frutasDisponibles={["CEREZA", "UVA", "CLEMENTINA", "GENÉRICA"]}
          onChangeFruit={() => {}}
          rangeOverride={{ min: 3.5, max: 12, idealMin: 4, idealMax: 9 }}
          onChangeRanges={() => {}}
        />
      )}
    </div>
  );
}
