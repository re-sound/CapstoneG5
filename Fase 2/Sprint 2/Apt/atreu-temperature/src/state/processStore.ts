// src/state/processStore.ts
export type Fruit = "CEREZA" | "UVA" | "CLEMENTINA" | "GENÉRICA";

export type ProcessStatus = "LIBRE" | "EN_CURSO" | "PAUSADO" | "FINALIZADO";

export type Ranges = { min: number; max: number; idealMin: number; idealMax: number };

export type Process = {
  id: string;
  tunnelId: number;
  fruit: Fruit;
  status: ProcessStatus;
  createdAt: string;   // ISO
  startedAt?: string;
  pausedAt?: string;
  resumedAt?: string;
  finishedAt?: string;

  // Campos de formulario
  operatorStart?: string;
  operatorEnd?: string;
  origin?: string;
  destination?: string;
  frequency?: "1m" | "5m" | "15m";
  notes?: string;

  // Rango usado para evaluar alertas durante el proceso
  ranges: Ranges;

  // Mock de pallets (Sprint 2/3 puedes expandir)
  pallets?: number[];
};

const KEY = "apt.processes.v1";

function loadAll(): Process[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Process[];
  } catch {
    return [];
  }
}

function saveAll(list: Process[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getProcessesByTunnel(tunnelId: number): Process[] {
  return loadAll().filter(p => p.tunnelId === tunnelId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getActiveProcess(tunnelId: number): Process | undefined {
  return loadAll().find(p => p.tunnelId === tunnelId && (p.status === "EN_CURSO" || p.status === "PAUSADO"));
}

export function createProcess(input: Omit<Process, "id" | "status" | "createdAt">): Process {
  const now = new Date().toISOString();
  const proc: Process = {
    id: uid(),
    createdAt: now,
    status: "EN_CURSO",
    startedAt: now,
    ...input,
  };
  const all = loadAll();
  // Cierra cualquier proceso activo que hubiese quedado colgado
  for (const p of all) {
    if (p.tunnelId === proc.tunnelId && (p.status === "EN_CURSO" || p.status === "PAUSADO")) {
      p.status = "FINALIZADO";
      p.finishedAt = now;
    }
  }
  all.push(proc);
  saveAll(all);
  return proc;
}

export function pauseProcess(id: string) {
  const all = loadAll();
  const p = all.find(x => x.id === id);
  if (!p || p.status !== "EN_CURSO") return;
  p.status = "PAUSADO";
  p.pausedAt = new Date().toISOString();
  saveAll(all);
}

export function resumeProcess(id: string) {
  const all = loadAll();
  const p = all.find(x => x.id === id);
  if (!p || p.status !== "PAUSADO") return;
  p.status = "EN_CURSO";
  p.resumedAt = new Date().toISOString();
  saveAll(all);
}

export function modifyProcess(id: string, patch: Partial<Pick<Process,
  "origin" | "destination" | "notes" | "frequency" | "ranges"
>>) {
  const all = loadAll();
  const p = all.find(x => x.id === id);
  if (!p || (p.status !== "EN_CURSO" && p.status !== "PAUSADO")) return;
  Object.assign(p, patch);
  saveAll(all);
}

export function finishProcess(id: string, operatorEnd?: string) {
  const all = loadAll();
  const p = all.find(x => x.id === id);
  if (!p || (p.status !== "EN_CURSO" && p.status !== "PAUSADO")) return;
  p.status = "FINALIZADO";
  p.finishedAt = new Date().toISOString();
  if (operatorEnd) p.operatorEnd = operatorEnd;
  saveAll(all);
}
