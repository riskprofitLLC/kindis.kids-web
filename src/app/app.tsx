import { ErrorBoundary } from '@/app/providers/error-boundary'
import { QueryProvider } from '@/app/providers/query-provider'
import { SessionProvider } from '@/app/providers/session-provider'
import { UiSettingsProvider } from '@/app/providers/ui-settings-provider'
import { AppRouter } from '@/app/router/app-router'
import { usePageMeta } from '@/shared/lib/use-page-meta'

export function App() {
  // Базовые меты проекта; страницы уточняют их своим вызовом хука
  usePageMeta({
    title: 'kindis.kids — handmade для детей',
    description:
      'Маркетплейс детских handmade-вещей: игрушки, одежда и декор ручной работы от небольших мастерских.',
  })

  return (
    <ErrorBoundary>
      <QueryProvider>
        <UiSettingsProvider>
          <SessionProvider>
            <AppRouter />
          </SessionProvider>
        </UiSettingsProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
