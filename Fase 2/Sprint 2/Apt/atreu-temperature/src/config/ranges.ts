// src/config/ranges.ts
import type { Range } from "../utils/eval";

// Rangos por defecto si el túnel no tiene proceso activo en processStore.
export const RANGES: Record<string, Range> = {
  CEREZA:     { min: 3,   max: 12,  idealMin: 4,   idealMax: 9 },
  UVA:        { min: 2,   max: 10,  idealMin: 3.5, idealMax: 8 },
  CLEMENTINA: { min: 4,   max: 14,  idealMin: 5,   idealMax: 9.5 },
  "GENÉRICA": { min: 3.5, max: 12,  idealMin: 4,   idealMax: 9 },
};
