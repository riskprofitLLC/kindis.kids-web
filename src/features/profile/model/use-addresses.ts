import { useState } from 'react'

import { storage } from '@/shared/lib/storage/web-storage'

// Адресная книга покупателя. API адресов на бэкенде нет — храним локально
// через web-адаптер (в React Native сюда подставится AsyncStorage).
export interface SavedAddress {
  id: string
  label: string
  city: string
  street: string
  house: string
  apartment: string
  zip: string
}

const KEY = 'kindis-addresses'

function read(): SavedAddress[] {
  try {
    const raw = storage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as SavedAddress[]) : []
  } catch {
    return []
  }
}

export function useAddresses() {
  const [items, setItems] = useState<SavedAddress[]>(read)

  const persist = (next: SavedAddress[]) => {
    setItems(next)
    storage.setItem(KEY, JSON.stringify(next))
  }

  const add = (input: Omit<SavedAddress, 'id'>) =>
    persist([
      ...items,
      { ...input, id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
    ])

  const remove = (id: string) => persist(items.filter((item) => item.id !== id))

  return { items, add, remove }
}
