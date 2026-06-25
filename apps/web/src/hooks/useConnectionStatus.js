import { useState, useEffect, useRef, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isApiReachable, setIsApiReachable] = useState(null)
  const [isCheckingApi, setIsCheckingApi] = useState(false)
  const intervalRef = useRef(null)
  const cancelledRef = useRef(false)

  const checkApi = useCallback(async () => {
    setIsCheckingApi(true)
    try {
      const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(2000) })
      if (!cancelledRef.current) setIsApiReachable(res.ok)
    } catch {
      if (!cancelledRef.current) setIsApiReachable(false)
    } finally {
      if (!cancelledRef.current) setIsCheckingApi(false)
    }
  }, [])

  const startPolling = useCallback(() => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(checkApi, 10000)
  }, [checkApi])

  const stopPolling = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  // wifi events
  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false)
      setIsApiReachable(false)
      stopPolling()
    }

    const handleOnline = () => {
      setIsOnline(true)
      checkApi()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkApi, stopPolling])

  // api-status events disparados pelo todoApi.js
  useEffect(() => {
    const handleApiStatus = (e) => {
      const reachable = e.detail.reachable
      setIsApiReachable(reachable)
      if (!reachable) startPolling()
      else stopPolling()
    }

    window.addEventListener('api-status', handleApiStatus)
    return () => window.removeEventListener('api-status', handleApiStatus)
  }, [startPolling, stopPolling])

  // quando o health check do polling retornar ok, para o polling
  useEffect(() => {
    if (isApiReachable === true) stopPolling()
  }, [isApiReachable, stopPolling])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      stopPolling()
    }
  }, [stopPolling])

  return { isOnline, isApiReachable, isCheckingApi }
}
