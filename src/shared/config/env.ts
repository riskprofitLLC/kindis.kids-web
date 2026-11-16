// Единая точка чтения переменных окружения (VITE_*).
// Дефолт включает префикс API бэкенда (/api/v1).
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3100/api/v1',
} as const
