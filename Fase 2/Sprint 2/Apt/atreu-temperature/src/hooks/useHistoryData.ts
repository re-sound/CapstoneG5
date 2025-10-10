// src/hooks/useHistoryData.ts
import { useEffect, useState } from "react";
import { apiGetHistory, type HistoryRow } from "../api/client";

export function useHistoryData(tunnelId: number, timeRange: number, intervalMs: number = 20000) {
  const [data, setData] = useState<HistoryRow[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await apiGetHistory(tunnelId, timeRange);
      setData(result);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch inmediato
    fetchData();

    // Configurar polling
    const timer = setInterval(fetchData, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [tunnelId, timeRange, intervalMs]);

  return { 
    data, 
    error, 
    loading, 
    refetch: fetchData 
  };
}
