import { useEffect, useRef, useState } from "react";
import useAlerts, { AlertItem } from "./useAlerts";

/**
 * Devuelve:
 * - alerts: TODAS las alertas (warn + alarm) por si necesitas listarlas
 * - newAlarms: SOLO las nuevas en estado ALARM desde el tick anterior
 */
export default function useNewAlarms(tunnels: any[]) {
  const alerts = useAlerts(tunnels);
  const [newAlarms, setNewAlarms] = useState<AlertItem[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const incoming = alerts.filter(a => a.status === "alarm");
    const fresh = incoming.filter(a => !seen.current.has(a.id));
    if (fresh.length > 0) {
      // Marcar como vistas
      fresh.forEach(a => seen.current.add(a.id));
      setNewAlarms(prev => [...prev, ...fresh]);
    }
  }, [alerts]);

  // función para descartar una alarma ya mostrada en modal
  const dismiss = (id: string) => {
    setNewAlarms(list => list.filter(a => a.id !== id));
  };

  // descartar todas (botón "Cerrar todo")
  const clearAll = () => setNewAlarms([]);

  return { alerts, newAlarms, dismiss, clearAll };
}
