const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type TunnelDto = {
  id: number;
  fruit: string;
  sensors: null | {
    AMB_OUT: number | "OUT";
    AMB_RET: number | "OUT";
    PULP_1: number | "OUT";
    PULP_2: number | "OUT";
    PULP_3: number | "OUT";
    PULP_4: number | "OUT";
  };
};

export type HistoryRow = {
  ts: string;
  AMB_OUT: number | "OUT";
  AMB_RET: number | "OUT";
  IZQ_EXT_ENT: number | "OUT";
  IZQ_INT_ENT: number | "OUT";
  DER_INT_ENT: number | "OUT";
  DER_EXT_ENT: number | "OUT";
  IZQ_EXT_SAL: number | "OUT";
  IZQ_INT_SAL: number | "OUT";
  DER_INT_SAL: number | "OUT";
  DER_EXT_SAL: number | "OUT";
  PULP_1: number | "OUT";
  PULP_2: number | "OUT";
  PULP_3: number | "OUT";
  PULP_4: number | "OUT";
};

export async function apiGetTunnels(): Promise<TunnelDto[]> {
  const r = await fetch(`${BASE}/api/tunnels`);
  if (!r.ok) throw new Error("Error al obtener túneles");
  return r.json();
}

export async function apiGetHistory(tunnelId: number, minutes = 60): Promise<HistoryRow[]> {
  const r = await fetch(`${BASE}/api/tunnels/${tunnelId}/history?minutes=${minutes}`);
  if (!r.ok) throw new Error("Error al obtener histórico");
  return r.json();
}

// --- Procesos ---
export type ProcessDto = {
  tunnel_id: number;
  status: "idle" | "running" | "paused" | "finished";
  fruit: string;
  min_temp: number;
  max_temp: number;
  ideal_min: number;
  ideal_max: number;
  started_at?: string;
  started_by?: string;
  ended_at?: string;
  ended_by?: string;
  measure_plan?: number;
  destination?: string;
  origin?: string;
  condition_initial?: string;
  state_label?: string;
  last_change?: string;
};

export async function apiGetAllProcesses(): Promise<ProcessDto[]> {
  const r = await fetch(`${BASE}/api/processes`);
  if (!r.ok) throw new Error("Error al obtener procesos");
  return r.json();
}

export async function apiGetProcess(tunnelId: number): Promise<ProcessDto> {
  const r = await fetch(`${BASE}/api/processes/${tunnelId}`);
  if (!r.ok) throw new Error("Error al obtener proceso");
  return r.json();
}

export async function apiStartProcess(tunnelId: number, payload: {
  fruit: string;
  min_temp: number;
  max_temp: number;
  ideal_min: number;
  ideal_max: number;
  started_by?: string;
  measure_plan?: number;
  destination?: string;
  origin?: string;
  condition_initial?: string;
}): Promise<{ ok: boolean; tunnelId: number; status: string }> {
  const r = await fetch(`${BASE}/api/processes/${tunnelId}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("Error al iniciar proceso");
  return r.json();
}

export async function apiUpdateRanges(tunnelId: number, ranges: {
  min_temp: number;
  max_temp: number;
  ideal_min: number;
  ideal_max: number;
}): Promise<{ ok: boolean }> {
  const r = await fetch(`${BASE}/api/processes/${tunnelId}/ranges`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ranges),
  });
  if (!r.ok) throw new Error("Error al actualizar rangos");
  return r.json();
}

export async function apiPauseProcess(tunnelId: number): Promise<{ ok: boolean; status: string }> {
  const r = await fetch(`${BASE}/api/processes/${tunnelId}/pause`, {
    method: "POST",
  });
  if (!r.ok) throw new Error("Error al pausar proceso");
  return r.json();
}

export async function apiResumeProcess(tunnelId: number): Promise<{ ok: boolean; status: string }> {
  const r = await fetch(`${BASE}/api/processes/${tunnelId}/resume`, {
    method: "POST",
  });
  if (!r.ok) throw new Error("Error al reanudar proceso");
  return r.json();
}

export async function apiFinalizeProcess(tunnelId: number, ended_by: string): Promise<{ ok: boolean; status: string }> {
  const r = await fetch(`${BASE}/api/processes/${tunnelId}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ended_by }),
  });
  if (!r.ok) throw new Error("Error al finalizar proceso");
  return r.json();
}

export async function apiGetProcessHistory(tunnelId: number): Promise<any[]> {
  const r = await fetch(`${BASE}/api/processes/${tunnelId}/history`);
  if (!r.ok) throw new Error("Error al obtener historial de procesos");
  return r.json();
}