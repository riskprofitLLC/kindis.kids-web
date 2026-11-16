import { Outlet } from 'react-router-dom'

import { Footer } from '@/widgets/footer/ui/footer'
import { Header } from '@/widgets/header/ui/header'
import { OfflineBanner } from '@/widgets/offline-banner/ui/offline-banner'

// Публичный layout: шапка + подвал (этап 0)
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Ссылка «в обход» для клавиатурной навигации */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Перейти к содержимому
      </a>
      <OfflineBanner />
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
