import { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isApiReachable, setIsApiReachable] = useState(null)
  const [isCheckingApi, setIsCheckingApi] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    function stopPolling() {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    function doCheck() {
      setIsCheckingApi(true)
      const start = Date.now()
      fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(2000) })
        .then((res) => {
          if (res.ok) {
            setIsApiReachable(true)
            stopPolling()
          }
        })
        .catch(() => setIsApiReachable(false))
        .finally(() => {
          const elapsed = Date.now() - start
          const delay = Math.max(0, 500 - elapsed)
          setTimeout(() => setIsCheckingApi(false), delay)
        })
    }

    function startPolling() {
      if (intervalRef.current) return
      doCheck()
      intervalRef.current = setInterval(doCheck, 10000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsApiReachable(false)
      startPolling()
    }

    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleApiStatus = (e) => {
      const { reachable } = e.detail
      setIsApiReachable(reachable)
      if (!reachable) startPolling()
      else stopPolling()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('api-status', handleApiStatus)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('api-status', handleApiStatus)
      stopPolling()
    }
  }, [])

  return { isOnline, isApiReachable, isCheckingApi }
}
