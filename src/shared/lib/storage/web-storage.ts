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

export const storage: KeyValueStorage =
  typeof window !== 'undefined' && window.localStorage ? window.localStorage : memoryFallback
