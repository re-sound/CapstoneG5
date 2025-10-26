import React from "react";
import useAlerts from "../hooks/useAlerts";
import { Tunnel } from "../types";

export default function AlertBanner({ tunnels }:{ tunnels: Tunnel[] }) {
  const alerts = useAlerts(tunnels);
  if (alerts.length === 0) return null;
  return (
    <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-red-200">
      <div className="font-semibold mb-1">Alertas activas</div>
      <ul className="text-sm grid gap-1">
        {alerts.map(a=>(
          <li key={a.id}>
            <span className={a.status==="alarm" ? "font-semibold" : ""}>
              Túnel {a.tunnel} · {a.sensor} → {a.value}°C · {a.status.toUpperCase()} ({a.fruit})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
