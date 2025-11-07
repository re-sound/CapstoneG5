// src/state/processStore.ts
// Mini-store sin dependencias para manejar procesos por túnel

import { RANGOS_POR_FRUTA } from "../data/tunnelMock";

export type Fruit = keyof typeof RANGOS_POR_FRUTA;
export type Range = { min: number; max: number; idealMin: number; idealMax: number };
export type ProcessStatus = "idle" | "running" | "paused" | "finished";
export type MeasurePlan = 15 | 5 | 1;

export type TunnelProcess = {
  tunnelId: number;
  status: ProcessStatus;

  fruit: Fruit;
  ranges: Range;

  startedAt?: string;
  startedBy?: string;
  pausedAt?: string;
  resumedAt?: string;
  finalizedAt?: string;
  measurePlan?: MeasurePlan;
  destination?: string;
  conditionInitial?: string;
  origin?: string;
  stateLabel?: string;

  lastChangeAt?: string;
  endedAt?: string;
  endedBy?: string;
};

export type HistoryItem = {
  id: string;
  tunnelId: number;
  fruit: Fruit;
  ranges: Range;
  startedAt: string;
  endedAt: string;
  endedBy: string;
  measurePlan?: MeasurePlan;
  destination?: string;
  conditionInitial?: string;
  origin?: string;
};

type StoreState = {
  byId: Map<number, TunnelProcess>;
  history: Map<number, HistoryItem[]>;
};

const state: StoreState = {
  byId: new Map(),
  history: new Map(),
};

// listeners sencillos (sin EventTarget para evitar issues con HMR)
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

function defaultProcess(tunnelId: number): TunnelProcess {
  const defFruit: Fruit = "GENÉRICA";
  const def = RANGOS_POR_FRUTA[defFruit];
  return {
    tunnelId,
    status: "idle",
    fruit: defFruit,
    ranges: { min: def.min, max: def.max, idealMin: def.idealMin, idealMax: def.idealMax },
    stateLabel: "Libre",
  };
}

export function getProcess(tunnelId: number): TunnelProcess | null {
  const existing = state.byId.get(tunnelId);
  if (existing) return existing;
  return null; // No hay proceso activo
}

export function startProcess(
  tunnelId: number,
  payload: {
    fruit: Fruit;
    ranges: Range;
    startedBy?: string;
    startedAt?: string;
    measurePlan?: MeasurePlan;
    destination?: string;
    conditionInitial?: string;
    origin?: string;
  }
) {
  const now = new Date().toISOString();
  state.byId.set(tunnelId, {
    tunnelId,
    status: "running",
    fruit: payload.fruit,
    ranges: payload.ranges,
    startedAt: payload.startedAt || now,
    startedBy: payload.startedBy || "Operador",
    measurePlan: payload.measurePlan ?? 15,
    destination: payload.destination ?? "",
    conditionInitial: payload.conditionInitial ?? "",
    origin: payload.origin ?? "",
    stateLabel: "Ocupado",
    lastChangeAt: now,
  });
  emit();
}

export function updateRanges(tunnelId: number, ranges: Range) {
  const p = getProcess(tunnelId);
  if (!p) return; // No hay proceso activo
  state.byId.set(tunnelId, { ...p, ranges, lastChangeAt: new Date().toISOString() });
  emit();
}

export function updateProcessInfo(
  tunnelId: number,
  patch: Partial<Omit<TunnelProcess, "tunnelId" | "status">>
) {
  const p = getProcess(tunnelId);
  if (!p) return; // No hay proceso activo
  state.byId.set(tunnelId, { ...p, ...patch, lastChangeAt: new Date().toISOString() });
  emit();
}

export function pauseProcess(tunnelId: number) {
  const p = getProcess(tunnelId);
  if (!p || p.status !== "running") return;
  state.byId.set(tunnelId, { ...p, status: "paused", lastChangeAt: new Date().toISOString() });
  emit();
}

export function resumeProcess(tunnelId: number) {
  const p = getProcess(tunnelId);
  if (!p || p.status !== "paused") return;
  state.byId.set(tunnelId, { ...p, status: "running", lastChangeAt: new Date().toISOString() });
  emit();
}

export function finalizeProcess(tunnelId: number, endedBy: string) {
  const p = getProcess(tunnelId);
  if (!p) return; // No hay proceso activo
  
  const endedAt = new Date().toISOString();

  // guardar snapshot en historial
  const item: HistoryItem = {
    id: `${tunnelId}-${endedAt}`,
    tunnelId,
    fruit: p.fruit,
    ranges: p.ranges,
    startedAt: p.startedAt || endedAt,
    endedAt,
    endedBy,
    measurePlan: p.measurePlan,
    destination: p.destination,
    conditionInitial: p.conditionInitial,
    origin: p.origin,
  };
  const list = state.history.get(tunnelId) ?? [];
  list.unshift(item);
  state.history.set(tunnelId, list);

  // volver a estado "Disponible"
  state.byId.set(tunnelId, { ...defaultProcess(tunnelId), lastChangeAt: endedAt });
  emit();
}

export function getHistory(tunnelId: number): HistoryItem[] {
  return state.history.get(tunnelId) ?? [];
}
export function clearHistory(tunnelId: number) {
  state.history.set(tunnelId, []);
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
