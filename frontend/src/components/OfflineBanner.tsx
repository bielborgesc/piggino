import { useEffect, useState } from 'react'

const OFFLINE_MESSAGE = 'Sem conexao — os dados podem estar desatualizados'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

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

  if (isOnline) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-yellow-900 text-center text-sm font-medium py-2 px-4"
    >
      {OFFLINE_MESSAGE}
    </div>
  )
}
