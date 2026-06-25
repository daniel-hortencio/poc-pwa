import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isApiReachable, setIsApiReachable] = useState(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!isOnline) {
      setIsApiReachable(false)
      return
    }

    let cancelled = false

    async function checkApi() {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) })
        if (!cancelled) setIsApiReachable(res.ok)
      } catch {
        if (!cancelled) setIsApiReachable(false)
      }
    }

    checkApi()
    const interval = setInterval(checkApi, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isOnline])

  return { isOnline, isApiReachable }
}
