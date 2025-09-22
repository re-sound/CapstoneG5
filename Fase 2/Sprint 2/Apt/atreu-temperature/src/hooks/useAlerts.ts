import { useEffect, useMemo, useState } from "react";
import type {Tunnel, Reading} from "../types";
import { RANGES } from "../config/ranges";
import { evalStatus } from "../utils/eval";

export interface AlertItem {
  id: string;
  tunnel: number;
  fruit: string;
  sensor: string;
  value: number | "OUT";
  status: "alarm" | "warn";
}

export default function useAlerts(tunnels: Tunnel[]) {
  const [tick, setTick] = useState(0);

  // “simula” refresco
  useEffect(()=>{
    const t = setInterval(()=>setTick(t=>t+1), 4000);
    return ()=>clearInterval(t);
  },[]);

  const alerts = useMemo<AlertItem[]>(()=> {
    const list: AlertItem[] = [];
    tunnels.forEach(t=>{
      const range = RANGES[t.fruit] ?? RANGES.GENÉRICA;
      t.readings.forEach((r: Reading) => {
        const st = evalStatus(r.value, range);
        if (st === "alarm" || st === "warn") {
          list.push({
            id: `T${t.id}-${r.kind}`,
            tunnel: t.id,
            fruit: t.fruit,
            sensor: r.kind,
            value: r.value,
            status: st,
          });
        }
      });
    });
    return list;
  }, [tunnels, tick]);

  return alerts;
}
