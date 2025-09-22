import { FruitRanges } from "../types";

export const RANGES: FruitRanges = {
  CEREZA:     { min: 3.5, max: 5.0, warnDelta: 0.2 },
  UVA:        { min: 3.5, max: 6.0, warnDelta: 0.2 },
  CLEMENTINA: { min: 4.0, max: 7.0, warnDelta: 0.3 },
  GENÉRICA:   { min: 3.5, max: 8.0, warnDelta: 0.3 },
};

export const SPECIAL_MIN_ALARM = 3.5; // regla negocio
export const SPECIAL_MIN_ALARM_TRIP = 3.4; // alarma si baja de esto
