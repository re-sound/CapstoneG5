import React from "react";

export default function CameraLegacyCard({
  name,
  temp,
  status = "DISPONIBLE",
}: {
  name: string;
  temp: number | "OUT";
  status?: "DISPONIBLE" | "EN_EJECUCION";
}) {
  const color = status === "EN_EJECUCION" ? "bg-sky-600" : "bg-emerald-600";
  return (
    <div className="rounded-[10px] border border-border bg-card overflow-hidden">
      <div className={`h-6 ${color} text-white text-[12px] px-2 flex items-center`}>{status}</div>
      <div className="px-3 py-2">
        <div className="text-[12px] text-on-dim">{name}</div>
        <div className="mt-1 text-[13px]">
          <span className="text-on-dim mr-2">Amb</span>
          <span className="text-on">{typeof temp === "number" ? temp.toFixed(1) : "OUT"}</span>
        </div>
      </div>
    </div>
  );
}
