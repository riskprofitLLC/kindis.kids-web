// Шина событий истечения сессии: api-слой не знает про React и роутер,
// поэтому подписку регистрирует app-слой (общий код с React Native сохраняется)
type Handler = () => void

const handlers = new Set<Handler>()

export const authEvents = {
  onExpired(handler: Handler): () => void {
    handlers.add(handler)
    return () => {
      handlers.delete(handler)
    }
  },
  emitExpired(): void {
    handlers.forEach((handler) => handler())
  },
}
