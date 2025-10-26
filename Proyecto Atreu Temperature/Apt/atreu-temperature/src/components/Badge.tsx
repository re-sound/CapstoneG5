import React from "react";
import type {Status} from "../utils/eval";

export default function Badge({value, status}:{value: number | "OUT"; status: Status}) {
  const color = status==="alarm" ? "bg-red-600"
    : status==="warn" ? "bg-amber-500"
    : status==="out" ? "bg-slate-600"
    : "bg-emerald-600";
  return (
    <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs text-white ${color}`}>
      {value==="OUT" ? "OUT" : `${value}°C`}
    </span>
  );
}
