import { ErrorBoundary } from '@/app/providers/error-boundary'
import { QueryProvider } from '@/app/providers/query-provider'
import { SessionProvider } from '@/app/providers/session-provider'
import { UiSettingsProvider } from '@/app/providers/ui-settings-provider'
import { AppRouter } from '@/app/router/app-router'

export function App() {
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
