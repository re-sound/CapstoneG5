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
