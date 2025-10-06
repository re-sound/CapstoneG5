// src/utils/eval.ts
export type Range = {
  min: number;       // alarma si < min
  max: number;       // alarma si > max
  idealMin: number;  // OK si entre idealMin..idealMax
  idealMax: number;
};

export type Status = "ok" | "warn" | "alarm" | "out";

export function evalStatus(v: number | "OUT", r: Range): Status {
  if (v === "OUT") return "out";
  if (v < r.min || v > r.max) return "alarm";
  if (v >= r.idealMin && v <= r.idealMax) return "ok";
  return "warn";
}
