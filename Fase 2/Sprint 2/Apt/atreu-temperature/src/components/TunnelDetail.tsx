// src/components/TunnelDetail.tsx
import { useMemo, useRef, useState } from "react";
import Modal from "./Modal";
import Tabs, { TabItem } from "./Tabs";
import ChartTab from "./ChartTab";
import {
  TUNELES_MOCK,
  RANGOS_POR_FRUTA,
  getHistorico,
} from "../data/tunnelMock";

type Fruit = keyof typeof RANGOS_POR_FRUTA;
type Range = { min: number; max: number; idealMin: number; idealMax: number };

export default function TunnelDetail({
  tunnelId,
  open,
  onClose,
}: {
  tunnelId: number;
  open: boolean;
  onClose: () => void;
}) {
  const tun = TUNELES_MOCK.find((t) => t.id === tunnelId)!;

  // Estado local: fruta del proceso y sus rangos
  const [fruit, setFruit] = useState<Fruit>(tun.fruta);
  const [ranges, setRanges] = useState<Range>(() => ({
    min: RANGOS_POR_FRUTA[tun.fruta].min,
    max: RANGOS_POR_FRUTA[tun.fruta].max,
    idealMin: RANGOS_POR_FRUTA[tun.fruta].idealMin,
    idealMax: RANGOS_POR_FRUTA[tun.fruta].idealMax,
  }));

  const historico = useMemo(() => getHistorico(tunnelId, 60), [tunnelId]);

  const tabs: TabItem[] = [
    {
      key: "temperaturas",
      label: "Temperaturas",
      content: <ResumenTemperaturas tunnelId={tunnelId} />,
    },
    {
      key: "grafico",
      label: "Gráfico",
      content: <ChartTab historico={historico} />,
    },
    {
      key: "procesos",
      label: "Procesos",
      content: (
        <ProcesosForm
          fruit={fruit}
          ranges={ranges}
          onChangeFruit={(f) => {
            setFruit(f);
            // Restablecer rangos por defecto de la especie
            const def = RANGOS_POR_FRUTA[f];
            setRanges({
              min: def.min,
              max: def.max,
              idealMin: def.idealMin,
              idealMax: def.idealMax,
            });
          }}
          onChangeRanges={(r) => setRanges(r)}
          onStart={() => {
            // Sprint 1: simular “guardar” proceso
            // Aquí luego llamas a tu API o a processStore.start(...)
            console.log("Iniciar proceso", { tunnelId, fruit, ranges });
            alert(`Proceso iniciado en Túnel ${tunnelId}\nFruta: ${fruit}\nRangos: ${ranges.idealMin}-${ranges.idealMax} (ideal), ${ranges.min}/${ranges.max} (alarma)`);
          }}
        />
      ),
    },
    {
      key: "historico",
      label: "Histórico",
      content: <HistoricoTable historico={historico} tunnelId={tunnelId} />,
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title={`Túnel ${tun.id} — ${fruit}`} maxWidth="max-w-6xl">
      <Tabs items={tabs} initial="temperaturas" />
    </Modal>
  );
}

/* ----------------- Subvistas ----------------- */

function ResumenTemperaturas({ tunnelId }: { tunnelId: number }) {
  const tun = TUNELES_MOCK.find((t) => t.id === tunnelId)!;
  const nums = Object.values(tun.sensores).filter((v) => typeof v === "number") as number[];
  const min = Math.min(...nums);
  const max = Math.max(...nums);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card title="Temp. mínima actual">
        <Big>{min.toFixed(1)}°C</Big>
      </Card>
      <Card title="Temp. máxima actual">
        <Big>{max.toFixed(1)}°C</Big>
      </Card>
      <Card title={`Fruta del túnel (mock)`}>
        <div className="text-xl font-semibold">{TUNELES_MOCK.find(t => t.id === tunnelId)!.fruta}</div>
        <div className="text-xs text-slate-400 mt-1">Se actualiza al iniciar un proceso con otra fruta.</div>
      </Card>

      <Card title="Ambiente (Salida)" subtitle="EXTERIOR">
        <Badge value={tun.sensores.AMB_OUT} />
      </Card>
      <Card title="Retorno" subtitle="EXTERIOR">
        <Badge value={tun.sensores.AMB_RET} />
      </Card>
      <Card title="Sensores interior/entrada">
        <div className="flex gap-2 flex-wrap">
          <Badge value={tun.sensores.PULP_2} label="IZQ INT ENT" />
          <Badge value={tun.sensores.PULP_1} label="DER INT ENT" />
        </div>
      </Card>
      <Card title="Sensores exterior/entrada">
        <div className="flex gap-2 flex-wrap">
          <Badge value={tun.sensores.PULP_4} label="DER EXT ENT" />
          <Badge value={tun.sensores.PULP_3} label="IZQ EXT ENT" />
        </div>
      </Card>
    </div>
  );
}

/* ----------------- Procesos ----------------- */

function ProcesosForm({
  fruit,
  ranges,
  onChangeFruit,
  onChangeRanges,
  onStart,
}: {
  fruit: Fruit;
  ranges: Range;
  onChangeFruit: (f: Fruit) => void;
  onChangeRanges: (r: Range) => void;
  onStart: () => void;
}) {
  function set<K extends keyof Range>(k: K, v: number) {
    onChangeRanges({ ...ranges, [k]: v });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40">
        <div className="font-semibold mb-3">Inicio de Proceso</div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Columna izquierda */}
          <div className="grid gap-3">
            <Field label="Fecha inicio">
              <input type="datetime-local" className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
            </Field>
            <Field label="Mediciones">
              <select className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2">
                <option>Cada 15 min</option>
                <option>Cada 5 min</option>
                <option>Cada 1 min</option>
              </select>
            </Field>
            <Field label="Destino">
              <input className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
            </Field>
            <Field label="Operador inicial">
              <input className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
            </Field>
          </div>

          {/* Columna derecha */}
          <div className="grid gap-3">
            <Field label="Especie (fruta)">
              <select
                value={fruit}
                onChange={(e) => onChangeFruit(e.target.value as Fruit)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              >
                {Object.keys(RANGOS_POR_FRUTA).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>

            <div className="rounded-lg border border-slate-700/60 p-3 bg-slate-900/30">
              <div className="font-medium mb-2">Rangos para alarmas y rango ideal</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <NumberBox label="Mín. alarma" value={ranges.min} onChange={(v) => set("min", v)} />
                <NumberBox label="Máx. alarma" value={ranges.max} onChange={(v) => set("max", v)} />
                <NumberBox label="Ideal desde" value={ranges.idealMin} onChange={(v) => set("idealMin", v)} />
                <NumberBox label="Ideal hasta" value={ranges.idealMax} onChange={(v) => set("idealMax", v)} />
              </div>
              <div className="text-xs text-slate-400 mt-2">
                Al cambiar la fruta se restablecen los rangos por defecto de esa especie.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Origen">
                <input className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
              </Field>
              <Field label="Estado">
                <input disabled value="Libre" className="w-full rounded border border-slate-800 bg-slate-800/60 px-3 py-2" />
              </Field>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onStart} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500">
            Iniciar
          </button>
          <button className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Histórico ----------------- */

function HistoricoTable({ historico, tunnelId }: { historico: any[]; tunnelId: number }) {
  const areaRef = useRef<HTMLDivElement>(null);

  async function exportPDF() {
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");
      const node = areaRef.current!;
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#0b1220" });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
      pdf.addImage(img, "PNG", x, y, w, h);
      pdf.save(`historico-tunel-${tunnelId}.pdf`);
    } catch (e) {
      console.error(e);
      alert("No se pudo exportar el PDF. ¿Instalaste jspdf y html2canvas?");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Últimas mediciones</div>
        <button onClick={exportPDF} className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500">
          Exportar PDF
        </button>
      </div>

      <div ref={areaRef} className="overflow-x-auto rounded-xl border border-slate-700/60 p-3 bg-slate-900/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-700">
              <th className="py-2">Fecha</th>
              <th className="py-2">AMB OUT</th>
              <th className="py-2">AMB RET</th>
              <th className="py-2">IZQ EXT ENT</th>
              <th className="py-2">IZQ INT ENT</th>
              <th className="py-2">DER INT ENT</th>
              <th className="py-2">DER EXT ENT</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((row) => (
              <tr key={row.ts} className="border-b border-slate-800">
                <td className="py-2">{new Date(row.ts).toLocaleString()}</td>
                <td className="py-2">{fmt(row.AMB_OUT)}</td>
                <td className="py-2">{fmt(row.AMB_RET)}</td>
                <td className="py-2">{fmt(row.IZQ_EXT_ENT ?? row.PULP_3)}</td>
                <td className="py-2">{fmt(row.IZQ_INT_ENT ?? row.PULP_2)}</td>
                <td className="py-2">{fmt(row.DER_INT_ENT ?? row.PULP_1)}</td>
                <td className="py-2">{fmt(row.DER_EXT_ENT ?? row.PULP_4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-400 mt-2">(* Datos simulados, Sprint 1)</div>
    </div>
  );
}

/* ----------------- helpers UI ----------------- */

function Card({ title, children, subtitle }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40">
      <div className="text-sm text-slate-300">{title}</div>
      {subtitle && <div className="text-[11px] text-slate-400">{subtitle}</div>}
      <div className="mt-2">{children}</div>
    </div>
  );
}
function Big({ children }: { children: React.ReactNode }) {
  return <div className="text-4xl font-extrabold">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-slate-300">{label}</div>
      {children}
    </label>
  );
}
function NumberBox({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-slate-300">{label}</div>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
      />
    </label>
  );
}
function Badge({ value, label }: { value: number | "OUT"; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded bg-slate-800 text-slate-100 text-xs px-3 py-1">
      {label && <span className="text-[10px] text-slate-300">{label}</span>}
      <span>{typeof value === "number" ? `${value}°C` : "OUT"}</span>
    </span>
  );
}
function fmt(v: number | "OUT") {
  return v === "OUT" ? "OUT" : `${v}°C`;
}
