import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { adminApi } from '@/shared/api/admin-api'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'

// Управление категориями：дерево + создание + удаление пустых.
export default function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const categories = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.categories(),
  })

  const create = useMutation({
    mutationFn: () => adminApi.createCategory({ name, slug }),
    onSuccess: () => {
      setName('')
      setSlug('')
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Категории</h1>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim() || !slug.trim()) return
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
          Slug
          <input
            className="min-h-11 rounded-md border border-border px-2 text-sm"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </label>
        <Button type="submit" disabled={create.isPending}>
          Создать
        </Button>
      </form>

      {(create.isError || remove.isError) && (
        <Alert variant="danger" title="Не получилось">
          Проверьте поля: slug уникален，категория пуста перед удалением.
        </Alert>
      )}

      <CategoryTree nodes={categories.data ?? []} onDelete={(id) => remove.mutate(id)} />
    </div>
  )
}

interface CategoryTreeProps {
  nodes: unknown[]
  onDelete: (id: string) => void
}

// Дерево категорий с кнопкой удаления у каждого узла.
function CategoryTree({ nodes, onDelete }: CategoryTreeProps) {
  const rows = nodes as Array<{
    id: string
    name: string
    children?: unknown[]
  }>

  return (
    <ul className="flex flex-col gap-1">
      {rows.map((node) => (
        <li key={node.id} className="flex items-center gap-2 text-sm text-text">
          <span className="flex-1">{node.name}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(node.id)}>
            Удалить
          </Button>
          {node.children && node.children.length > 0 && (
            <div className="ml-4">
              <CategoryTree nodes={node.children} onDelete={onDelete} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
