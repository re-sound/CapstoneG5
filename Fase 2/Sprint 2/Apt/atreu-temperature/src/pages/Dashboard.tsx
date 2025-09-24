import React, { useMemo, useState } from "react";
import TunnelCardRect from "../components/TunnelCardRect";
import { TUNELES_MOCK } from "../data/tunnelMock";
import TunnelDetail from "../components/TunnelDetail";

// paleta/variables para el tema LH (verde)
const pageVars =
  "[@supports(color:oklab(0%_0_0))]:[color-scheme:dark] " +
  "[--bg:#0c1114] [--cardBg:#0f1518] [--cardBorder:#1e2a22] " +
  "[--panelBg:#0b1316] [--panelBorder:#203229] " +
  "[--accent:#6db33f] [--accent2:#2bb673]";

type Fruit = "CEREZA" | "UVA" | "CLEMENTINA" | "GENÉRICA";

export default function Dashboard() {
  const [selected, setSelected] = useState<number | null>(null);

  // cámaras simuladas un poco más grandes y centradas
  const cameras = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        temp: +(6 + Math.random() * 2 - 1).toFixed(1),
      })),
    []
  );

  return (
    <div className={`${pageVars} min-h-screen bg-[var(--bg)] text-slate-100`}>
      <div className="mx-auto w-full max-w-[1920px] px-5 py-6">
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">
          Temperaturas
        </h1>

        {/* Grid de túneles: más angosto por tarjeta, más columnas en wide */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {TUNELES_MOCK.map((t) => (
            <TunnelCardRect
              key={t.id}
              id={t.id}
              fruta={t.fruta}
              onClick={() => setSelected(t.id)}
            />
          ))}
        </div>

        {/* Cámaras – fila grande y centrada, ocupa todo el ancho */}
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
