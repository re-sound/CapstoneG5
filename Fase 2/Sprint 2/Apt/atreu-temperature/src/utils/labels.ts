import { SensorKind } from "../types";

export function sensorLabel(kind: SensorKind) {
  switch (kind) {
    case "AMB_OUT": return "Temperatura ambiente — Salida";
    case "AMB_RET": return "Temperatura ambiente — Retorno";
    // Consideramos pulpas como "sensor interior" (palets).
    // Si más adelante agregan sensores “exterior”, pueden crear un kind PULP_EXT_#
    case "PULP_1": return "Sensor interior 1 (pulpa)";
    case "PULP_2": return "Sensor interior 2 (pulpa)";
    case "PULP_3": return "Sensor interior 3 (pulpa)";
    case "PULP_4": return "Sensor interior 4 (pulpa)";
    default: return kind;
  }
}

export function shortSensor(kind: SensorKind) {
  switch (kind) {
    case "AMB_OUT": return "AMB Salida";
    case "AMB_RET": return "AMB Retorno";
    case "PULP_1": return "PULP 1";
    case "PULP_2": return "PULP 2";
    case "PULP_3": return "PULP 3";
    case "PULP_4": return "PULP 4";
    default: return kind;
  }
}
