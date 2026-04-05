// src/hooks/useApi.js
import { useState, useEffect, useCallback } from 'react'

/**
 * Generic hook that calls an async fetcher on mount (and when deps change).
 * Returns { data, loading, error, refetch }
 */
export function useApi(fetcher, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])

  return { data, loading, error, refetch: run }
}

/**
 * Lazy hook — does NOT auto-fetch. Call trigger() manually.
 */
export function useLazyApi(fetcher) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const trigger = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher(...args)
      setData(result)
      return result
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  return { data, loading, error, trigger }
}
