// src/data/tunnelMock.ts
export type SensorKind = "AMB_OUT" | "AMB_RET" | "PULP_1" | "PULP_2" | "PULP_3" | "PULP_4";
export type SensorMeta = { id: SensorKind; label: string; position: "EXTERIOR" | "INTERIOR"; };
export type Tunnel = {
  id: number;
  fruta: "CEREZA" | "UVA" | "CLEMENTINA" | "GENÉRICA";
  sensores: Record<SensorKind, number | "OUT">; // OUT = sin lectura
};

export const SENSOR_DEFS: SensorMeta[] = [
  { id: "AMB_OUT", label: "Ambiente (Salida)", position: "EXTERIOR" },
  { id: "AMB_RET", label: "Retorno", position: "EXTERIOR" },
  { id: "PULP_1", label: "Pulp 1", position: "INTERIOR" },
  { id: "PULP_2", label: "Pulp 2", position: "INTERIOR" },
  { id: "PULP_3", label: "Pulp 3", position: "INTERIOR" },
  { id: "PULP_4", label: "Pulp 4", position: "INTERIOR" },
];

// Reglas por FRUTA (mock, ajústalo luego con el manual)
export const RANGOS_POR_FRUTA = {
  CEREZA:      { idealMin: 4, idealMax: 10, warnBaja: 3.4, min: 3.5, max: 12 },
  UVA:         { idealMin: 4, idealMax: 9,  warnBaja: 3.4, min: 3.5, max: 11 },
  CLEMENTINA:  { idealMin: 7, idealMax: 12, warnBaja: 6.5, min: 6.6, max: 14 },
  GENÉRICA:    { idealMin: 4, idealMax: 11, warnBaja: 3.4, min: 3.5, max: 13 },
};
export type Rango = (typeof RANGOS_POR_FRUTA)[keyof typeof RANGOS_POR_FRUTA];

export function estadoSensor(temp: number, rango: Rango) {
  if (temp === undefined || temp === null) return "NA";
  if (temp < rango.warnBaja) return "ALARM_BAJA";
  if (temp < rango.min)     return "WARN_BAJA";
  if (temp > rango.max)     return "ALARM_ALTA";
  if (temp >= rango.idealMin && temp <= rango.idealMax) return "OK";
  return "FUERA_IDEAL";
}

export const TUNELES_MOCK: Tunnel[] = Array.from({ length: 7 }, (_, i) => {
  const fruta = (["CEREZA", "UVA", "CLEMENTINA"] as const)[i % 3];
  const base = 8 + (i % 3) * 0.8;
  return {
    id: i + 1,
    fruta,
    sensores: {
      AMB_OUT: +(base + 2.1).toFixed(1),
      AMB_RET: +(base - 0.8).toFixed(1),
      PULP_1: +(base + 0.2).toFixed(1),
      PULP_2: +(base - 0.1).toFixed(1),
      PULP_3: +(base - 0.5).toFixed(1),
      PULP_4: i === 2 ? "OUT" : +(base + 1).toFixed(1),
    },
  };
});

// ------- Histórico simulado (timestamps + lecturas por sensor) -------
export function getHistorico(tunnelId: number, minutes = 30) {
  const tun = TUNELES_MOCK.find(t => t.id === tunnelId)!;
  const now = Date.now();
  return Array.from({ length: minutes }, (_, k) => {
    const t = new Date(now - (minutes - 1 - k) * 60_000);
    const jitter = (n: number) => +(n + (Math.random() - 0.5) * 0.6).toFixed(1);
    const s = tun.sensores;
    return {
      ts: t.toISOString(),
      AMB_OUT: typeof s.AMB_OUT === "number" ? jitter(s.AMB_OUT) : "OUT",
      AMB_RET: typeof s.AMB_RET === "number" ? jitter(s.AMB_RET) : "OUT",
      PULP_1: typeof s.PULP_1 === "number" ? jitter(s.PULP_1) : "OUT",
      PULP_2: typeof s.PULP_2 === "number" ? jitter(s.PULP_2) : "OUT",
      PULP_3: typeof s.PULP_3 === "number" ? jitter(s.PULP_3) : "OUT",
      PULP_4: typeof s.PULP_4 === "number" ? jitter(s.PULP_4) : "OUT",
    };
  });
}

// ------- Procesos simulados -------
export type ProcesoEstado = "EN_CURSO" | "PAUSADO" | "FINALIZADO";
export type Proceso = {
  id: string;
  tunnelId: number;
  operadorInicio: string;
  fechaInicio: string; // ISO
  fechaFin?: string;
  estado: ProcesoEstado;
  notas?: string;
  // campos que el manual pide en modificar/finalizar (mock mínimos)
  destino?: string;
  motivoPausa?: string;
};

const PROCESOS_DB: Proceso[] = [
  { id: "P-1001", tunnelId: 1, operadorInicio: "Operador A", fechaInicio: isoMinsAgo(50), estado: "EN_CURSO" },
  { id: "P-1000", tunnelId: 1, operadorInicio: "Operador B", fechaInicio: isoMinsAgo(220), fechaFin: isoMinsAgo(170), estado: "FINALIZADO", notas: "OK temporada" },
  { id: "P-1002", tunnelId: 2, operadorInicio: "Operador C", fechaInicio: isoMinsAgo(30), estado: "PAUSADO", motivoPausa: "Revisión sensor" },
];

function isoMinsAgo(n: number) {
  return new Date(Date.now() - n*60_000).toISOString();
}

export function getProcesosByTunnel(tunnelId: number): Proceso[] {
  return PROCESOS_DB.filter(p => p.tunnelId === tunnelId).sort((a,b) => b.fechaInicio.localeCompare(a.fechaInicio));
}

export function createProceso(tunnelId: number, operadorInicio: string, notas?: string): Proceso {
  const id = `P-${Math.floor(1000 + Math.random()*9000)}`;
  const p: Proceso = { id, tunnelId, operadorInicio, fechaInicio: new Date().toISOString(), estado: "EN_CURSO", notas };
  PROCESOS_DB.unshift(p);
  return p;
}

export function pauseProceso(id: string, motivoPausa: string) {
  const p = PROCESOS_DB.find(x => x.id === id);
  if (p && p.estado === "EN_CURSO") { p.estado = "PAUSADO"; p.motivoPausa = motivoPausa; }
}

export function resumeProceso(id: string) {
  const p = PROCESOS_DB.find(x => x.id === id);
  if (p && p.estado === "PAUSADO") { p.estado = "EN_CURSO"; p.motivoPausa = undefined; }
}

export function updateProceso(id: string, patch: Partial<Proceso>) {
  const p = PROCESOS_DB.find(x => x.id === id);
  if (p) Object.assign(p, patch);
}

export function finishProceso(id: string, notas?: string) {
  const p = PROCESOS_DB.find(x => x.id === id);
  if (p && p.estado !== "FINALIZADO") { p.estado = "FINALIZADO"; p.fechaFin = new Date().toISOString(); p.notas = notas ?? p.notas; }
}

// Mediciones por proceso (mock sencillo: reutiliza histórico del túnel)
export function getMedicionesProceso(tunnelId: number) {
  return getHistorico(tunnelId, 30);
}




/* ==== Adaptador para el rectángulo de 8 sensores ==== */
export type RectSensors = {
  // entrada (arriba, laterales)
  IZQ_EXT_ENT: number | "OUT";
  IZQ_INT_ENT: number | "OUT";
  DER_INT_ENT: number | "OUT";
  DER_EXT_ENT: number | "OUT";
  // salida (abajo)
  IZQ_EXT_SAL: number | "OUT";
  IZQ_INT_SAL: number | "OUT";
  DER_INT_SAL: number | "OUT";
  DER_EXT_SAL: number | "OUT";
  // siempre disponibles
  AMB_OUT: number | "OUT";
  AMB_RET: number | "OUT";
};

/**
 * Convierte los sensores del mock (AMB_*, PULP_1..4) a las 8 posiciones del rectángulo.
 * Mapeo por defecto:
 *   ENTRADA:  IZQ_EXT -> PULP_1, IZQ_INT -> PULP_2, DER_INT -> PULP_3, DER_EXT -> PULP_4
 *   SALIDA:   (si no hay valores específicos de salida) se repiten los de entrada
 */
export function toRectSensors(tunnelId: number): RectSensors {
  const tun = TUNELES_MOCK.find(t => t.id === tunnelId)!;
  const s = tun.sensores as any;

  const izqExtEnt = s.PULP_1 ?? "OUT";
  const izqIntEnt = s.PULP_2 ?? "OUT";
  const derIntEnt = s.PULP_3 ?? "OUT";
  const derExtEnt = s.PULP_4 ?? "OUT";

  // Si más adelante tienes lecturas reales de "salida", cámbialas aquí.
  const izqExtSal = izqExtEnt;
  const izqIntSal = izqIntEnt;
  const derIntSal = derIntEnt;
  const derExtSal = derExtEnt;

  return {
    IZQ_EXT_ENT: izqExtEnt,
    IZQ_INT_ENT: izqIntEnt,
    DER_INT_ENT: derIntEnt,
    DER_EXT_ENT: derExtEnt,
    IZQ_EXT_SAL: izqExtSal,
    IZQ_INT_SAL: izqIntSal,
    DER_INT_SAL: derIntSal,
    DER_EXT_SAL: derExtSal,
    AMB_OUT: s.AMB_OUT ?? "OUT",
    AMB_RET: s.AMB_RET ?? "OUT",
  };
}

/* Extiende el histórico simulado con las claves nuevas,
   para que la pestaña "Histórico" también tenga datos. */
export function getHistoricoRect(tunnelId: number, minutes = 20) {
  const base = getHistorico(tunnelId, minutes);
  const tun = TUNELES_MOCK.find(t => t.id === tunnelId)!;
  const map = toRectSensors(tunnelId);
  return base.map((row) => ({
    ...row,
    AMB_OUT: map.AMB_OUT,
    AMB_RET: map.AMB_RET,
    IZQ_EXT_ENT: map.IZQ_EXT_ENT,
    IZQ_INT_ENT: map.IZQ_INT_ENT,
    DER_INT_ENT: map.DER_INT_ENT,
    DER_EXT_ENT: map.DER_EXT_ENT,
    IZQ_EXT_SAL: map.IZQ_EXT_SAL,
    IZQ_INT_SAL: map.IZQ_INT_SAL,
    DER_INT_SAL: map.DER_INT_SAL,
    DER_EXT_SAL: map.DER_EXT_SAL,
  }));
}
