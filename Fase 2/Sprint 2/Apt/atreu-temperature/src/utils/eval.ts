import type {Range} from "../types";
import { SPECIAL_MIN_ALARM, SPECIAL_MIN_ALARM_TRIP } from "../config/ranges";

export type Status = "ok" | "warn" | "alarm" | "out";

export function evalStatus(value: number | "OUT", range: Range): Status {
  if (value === "OUT") return "out";
  const { min, max, warnDelta = 0.3 } = range;

  // Regla especial 3.5°C => alarma si < 3.4
  if (min === SPECIAL_MIN_ALARM && value <= SPECIAL_MIN_ALARM_TRIP) {
    return "alarm";
  }

  if (value < min || value > max) return "alarm";
  if (value <= min + warnDelta || value >= max - warnDelta) return "warn";
  return "ok";
}

// Detección simple de anómalo: punto muy alejado del resto
export function markOutlier(values: number[], factor = 2.0): number | null {
  if (values.length < 3) return null;
  const mean = values.reduce((a,b)=>a+b,0)/values.length;
  const variance = values.reduce((a,b)=>a + (b-mean)**2, 0) / values.length;
  const std = Math.sqrt(variance);
  let idx = -1, maxZ = 0;
  values.forEach((v, i) => {
    const z = Math.abs((v - mean) / (std || 1));
    if (z > maxZ) { maxZ = z; idx = i; }
  });
  return maxZ >= factor ? idx : null;
}
