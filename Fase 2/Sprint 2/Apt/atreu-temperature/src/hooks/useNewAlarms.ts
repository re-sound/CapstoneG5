// src/hooks/useNewAlarms.ts
import { useEffect, useRef, useState } from "react";
import useAlerts, { AlertItem, TunnelLive } from "./useAlerts";

/**
 * Devuelve:
 * - alerts: TODAS las alertas (warn + alarm)
 * - newAlarms: SOLO las NUEVAS en estado "alarm" (no warn) desde el tick anterior
 * - dismiss / clearAll: helpers para cerrar toasts/panel
 */
export default function useNewAlarms(tunnels: TunnelLive[]) {
  const alerts = useAlerts(tunnels);
  const [newAlarms, setNewAlarms] = useState<AlertItem[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const incoming = alerts.filter((a) => a.status === "alarm");
    const fresh = incoming.filter((a) => !seen.current.has(a.id));
    if (fresh.length > 0) {
      fresh.forEach((a) => seen.current.add(a.id));
      setNewAlarms((prev) => [...prev, ...fresh]);
    }
  }, [alerts]);

  const dismiss = (id: string) => {
    setNewAlarms((list) => list.filter((a) => a.id !== id));
  };

  const clearAll = () => setNewAlarms([]);

  return { alerts, newAlarms, dismiss, clearAll };
}
