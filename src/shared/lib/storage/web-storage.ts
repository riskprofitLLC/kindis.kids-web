// Web-адаптер хранилища: единственное место с localStorage.
// В React Native сюда подставится AsyncStorage — интерфейс тот же.
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const memory = new Map<string, string>()

const memoryFallback: KeyValueStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => void memory.set(key, value),
  removeItem: (key) => void memory.delete(key),
}

// Приватный режим Safari и запрет cookies бросают SecurityError на само обращение
// к window.localStorage，поэтому доступ проверяем реальной записью，а не наличием свойства.
function resolveLocalStorage(): KeyValueStorage | null {
  try {
    const probeKey = '__kindis_storage_probe__'
    window.localStorage.setItem(probeKey, '1')
    window.localStorage.removeItem(probeKey)
    return window.localStorage
  } catch {
    return null
  }
}

export const storage: KeyValueStorage =
  typeof window !== 'undefined' ? resolveLocalStorage() ?? memoryFallback : memoryFallback