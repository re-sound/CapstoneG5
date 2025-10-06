// src/hooks/usePolling.ts
import { useEffect, useRef, useState } from "react";

export function usePolling<T>(fn: () => Promise<T>, intervalMs: number, initial?: T) {
  const [data, setData] = useState<T | undefined>(initial);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | null>(null);

  const tick = async () => {
    try {
      const res = await fn();
      setData(res);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Primer fetch inmediato
    tick();
    // Luego refresca
    timer.current = window.setInterval(tick, intervalMs);
    return () => {
      if (timer.current) {
        window.clearInterval(timer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return { data, error, loading, refetch: tick };
}
