// src/components/Tabs.tsx
import { ReactNode, useState } from "react";

export type TabItem = {
  key: string;
  label: string;
  content: ReactNode;
};

export default function Tabs({ items, initial = "resumen" }: { items: TabItem[]; initial?: string }) {
  const [active, setActive] = useState(initial);
  return (
    <div>
      <div className="flex gap-2 border-b border-slate-700">
        {items.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3 py-2 text-sm rounded-t-md ${
              active === t.key
                ? "bg-sky-600 text-white"
                : "hover:bg-slate-800 text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {items.find((t) => t.key === active)?.content}
      </div>
    </div>
  );
}
