// src/components/TunnelTopView.tsx
type Props = {
  titulo: string;
  fruta: string;
  tick: number;
  ambOut: number | "OUT";
  ambRet: number | "OUT";
  izqExt: number | "OUT";
  izqInt: number | "OUT";
  derInt: number | "OUT";
  derExt: number | "OUT";
  onClick?: () => void;
};

export default function TunnelTopView({
  titulo,
  fruta,
  tick,
  ambOut,
  ambRet,
  izqExt,
  izqInt,
  derInt,
  derExt,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-sky-700 bg-card p-3 hover:ring-2 hover:ring-sky-500 transition cursor-pointer focus-brand"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-on">{titulo}</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-card focus-brand">{fruta}</span>
          <span className="px-2 py-0.5 rounded bg-card focus-brand">tick {tick}</span>
        </div>
      </div>

      {/* Escenario del túnel (compacto y SIN recortes) */}
      <div className="relative mx-auto bg-card rounded-lg border border-border w-[300px] h-[200px] overflow-visible focus-brand">
        {/* Cámara (marco interior) */}
        <div className="absolute inset-4 rounded-md border border-border"></div>

        {/* Hot air / salida (barra roja arriba) */}
        <div className="absolute top-4 left-10 right-10 h-1 rounded bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.5)]"></div>

        {/* Ambiente OUT centrado arriba */}
        <ChipCenter y="top-[-14px]" value={ambOut} />

        {/* Retorno (AMB_RET) centrado abajo */}
        <ChipCenter y="bottom-[-14px]" value={ambRet} />

        {/* Sensores laterales (ahora sin posiciones negativas y con overflow-visible) */}
        <ChipSide side="left"  top="28%" label="IZQ EXT" value={izqExt} />
        <ChipSide side="left"  top="64%" label="IZQ INT" value={izqInt} />
        <ChipSide side="right" top="28%" label="DER INT" value={derInt} />
        <ChipSide side="right" top="64%" label="DER EXT" value={derExt} />
      </div>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function ChipCenter({ y, value }: { y: string; value: number | "OUT" }) {
  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 ${y} text-xs px-2 py-0.5 rounded bg-slate-700/80 text-on`}
    >
      {fmt(value)}
    </div>
  );
}

function ChipSide({
  side,
  top,
  label,
  value,
}: {
  side: "left" | "right";
  top: string; // e.g. "28%"
  label: string;
  value: number | "OUT";
}) {
  // Anclamos el chip por fuera del borde pero sin números negativos:
  // colocamos un contenedor de 0 ancho y desplazamos con translateX.
  return (
    <div
      className={`absolute ${side === "left" ? "left-0 -translate-x-[110%]" : "right-0 translate-x-[110%]"} `}
      style={{ top }}
    >
      <span
        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
          value === "OUT" ? "bg-slate-600 text-white" : "bg-emerald-600 text-white"
        }`}
      >
        {label} {fmt(value)}
      </span>
    </div>
  );
}

function fmt(v: number | "OUT") {
  return v === "OUT" ? "OUT" : `${v}°C`;
}
