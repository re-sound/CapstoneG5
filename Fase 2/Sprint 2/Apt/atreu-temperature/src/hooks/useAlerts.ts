// src/hooks/useAlerts.ts
import { useMemo } from "react";
import { evalStatus, type Range, type Status } from "../utils/eval";
import { getProcess } from "../state/processStore";

export type SensorsShort = {
  AMB_OUT?: number | "OUT";
  AMB_RET?: number | "OUT";
  PULP_1?: number | "OUT";
  PULP_2?: number | "OUT";
  PULP_3?: number | "OUT";
  PULP_4?: number | "OUT";
};

export type TunnelLive = {
  id: number;
  fruit: string;
  sensors: SensorsShort | null;
};

export interface AlertItem {
  id: string;
  tunnel: number;
  fruit: string;
  sensor: string; // nombre legible (IZQ_INT_ENT, etc.)
  value: number | "OUT";
  status: Exclude<Status, "ok" | "out">;
}

// 🔄 Mapeo de etiquetas humanizadas
const SENSOR_LABELS: Record<string, string> = {
  AMB_OUT: "AMB_OUT",
  AMB_RET: "AMB_RET",
  PULP_1: "DER_INT_ENT",
  PULP_2: "IZQ_INT_ENT",
  PULP_3: "IZQ_EXT_ENT",
  PULP_4: "DER_EXT_ENT",
};

export default function useAlerts(tunnels: TunnelLive[]) {
  const alerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = [];

    tunnels.forEach((t) => {
      const sensors = t.sensors;
      if (!sensors) return;

      const proc = safeGetProcess(t.id);
      
      // 🔥 SOLO generar alarmas si hay un proceso activo
      if (!proc || !proc.ranges) {
        return; // No hay proceso activo, no generar alarmas
      }

      const range: Range = proc.ranges;

      const entries = Object.entries(sensors) as [keyof SensorsShort, number | "OUT"][];
      entries.forEach(([key, value]) => {
        const st = evalStatus(value, range);
        if (st === "alarm" || st === "warn") {
          const label = SENSOR_LABELS[key] ?? key;
          list.push({
            id: `T${t.id}-${key}`,
            tunnel: t.id,
            fruit: t.fruit,
            sensor: label, // 👈 usamos el nombre legible
            value,
            status: st,
          });
        }
      });
    });

    return list;
  }, [tunnels]);

  return alerts;
}

function safeGetProcess(tunnelId: number): { ranges?: Range } | null {
  try {
    const p = getProcess(tunnelId);
    return p;
  } catch {
    return null;
  }
}
