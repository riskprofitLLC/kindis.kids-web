import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

// Error-boundary с понятным текстом (этап 0)
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled error:', error, info)
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }
    return (
      <div role="alert" className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold text-text">Что-то сломалось</h1>
        <p className="mt-2 text-text-muted">
          Страница не смогла загрузиться. Обновите страницу или вернитесь позже.
        </p>
        <button
          type="button"
          className="mt-4 min-h-11 rounded-md bg-primary px-4 text-primary-foreground"
          onClick={() => window.location.reload()}
        >
          Обновить страницу
        </button>
      </div>
    )
  }
}
