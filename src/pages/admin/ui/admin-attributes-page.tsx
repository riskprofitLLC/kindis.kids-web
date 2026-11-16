import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { adminApi } from '@/shared/api/admin-api'
import { Button } from '@/shared/ui/button/button'

// Справочник характеристик：создание и удаление.
export default function AdminAttributesPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')

  const attributes = useQuery({
    queryKey: ['admin-attributes'],
    queryFn: () => adminApi.attributes(),
  })

  const create = useMutation({
    mutationFn: () => adminApi.createAttribute({ name, type: 'text', unit }),
    onSuccess: () => {
      setName('')
      setUnit('')
      void queryClient.invalidateQueries({ queryKey: ['admin-attributes'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteAttribute(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['admin-attributes'] }),
  })

  const rows = (attributes.data ?? []) as Array<{
    id: string
    name: string
    unit?: string | null
  }>

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Характеристики</h1>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          create.mutate()
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          Название
          <input
            className="min-h-11 rounded-md border border-border px-2 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Единица
          <input
            className="min-h-11 rounded-md border border-border px-2 text-sm"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          />
        </label>
        <Button type="submit" disabled={create.isPending}>
          Создать
        </Button>
      </form>

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-2 rounded-card border border-border p-3 text-sm"
          >
            <span className="text-text">
              {row.name}
              {row.unit ? `，${row.unit}` : ''}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove.mutate(row.id)}
            >
              Удалить
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
