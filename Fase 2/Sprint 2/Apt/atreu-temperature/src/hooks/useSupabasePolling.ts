import { useState, useEffect, useRef } from 'react'

export function useSupabasePolling<T>(
  fetchFunction: () => Promise<T>,
  interval: number = 5000
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = async () => {
    try {
      setError(null)
      const result = await fetchFunction()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    intervalRef.current = setInterval(fetchData, interval)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval])

  return { data, loading, error, refetch: fetchData }
}