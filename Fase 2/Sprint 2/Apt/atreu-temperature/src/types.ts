export type Role = "admin" | "operador" | "observador";

export type Fruit = "CEREZA" | "UVA" | "CLEMENTINA" | "GENÉRICA";

export type SensorKind = "AMB_OUT" | "AMB_RET" | "PULP_1" | "PULP_2" | "PULP_3" | "PULP_4";

export interface Range {
  min: number;      // mínimo ideal
  max: number;      // máximo ideal
  warnDelta?: number; // margen para amarillo (ej. 0.3°C)
}

export interface FruitRanges {
  [fruit in Fruit]: Range;
}

export interface Reading {
  kind: SensorKind;
  value: number | "OUT";
}

export interface Tunnel {
  id: number;
  fruit: Fruit;
  readings: Reading[];        // incluye AMB_OUT, AMB_RET, PULP_1..4
  tick: number;
}

export interface Camera {
  id: number;
  ambient: number;
}
