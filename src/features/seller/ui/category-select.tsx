import { useCategories } from '@/features/catalog/model/use-categories'
import type { CategoryNode } from '@/shared/api/catalog-api'

interface CategorySelectProps {
  value: string
  onChange: (categoryId: string) => void
}

// Дерево категорий в плоский список с отступами по уровням.
function flatten(nodes: CategoryNode[], depth = 0): Array<CategoryNode & { depth: number }> {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flatten(node.children, depth + 1)])
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const categories = useCategories()
  const options = flatten(categories.data ?? [])

  return (
    <label className="flex flex-col gap-1 text-sm">
      Категория
      <select
        className="min-h-11 rounded-md border border-border px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Без категории</option>
        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
            style={{ paddingLeft: `${option.depth * 12}px` }}
          >
            {option.name}
          </option>
        ))}
      </select>
    </label>
  )
}
