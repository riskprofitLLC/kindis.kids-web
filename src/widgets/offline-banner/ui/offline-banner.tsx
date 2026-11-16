import { useEffect, useState } from 'react'

// Баннер офлайна：браузер сообщает о потере сети событиями online/offline.
export function OfflineBanner() {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-danger px-4 py-2 text-center text-sm text-white"
    >
      Нет связи с интернетом — показаны сохранённые данные. Проверьте подключение.
    </div>
  )
}
