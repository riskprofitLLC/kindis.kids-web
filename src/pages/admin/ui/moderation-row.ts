import { formatDate, formatPrice } from '@/shared/lib/format'

// Очередь модерации:профили,товары,медиа,отзывы,жалобы.
export type QueueKind = 'profiles' | 'products' | 'media' | 'reviews' | 'reports'

export const QUEUES: Array<{ kind: QueueKind; label: string }> = [
  { kind: 'profiles', label: 'Профили' },
  { kind: 'products', label: 'Товары' },
  { kind: 'media', label: 'Медиа' },
  { kind: 'reviews', label: 'Отзывы' },
  { kind: 'reports', label: 'Жалобы' },
]

const REPORT_TARGET_LABELS: Record<string, string> = {
  product: 'Товар',
  child_profile: 'Профиль ребенка',
  review: 'Отзыв',
  message: 'Сообщение',
}

type Row = Record<string, unknown>

export interface RowView {
  title: string
  lines: string[]
}

// Поля очередей разные（профиль/товар/отзыв）— берём первую непустую строку.
function text(row: Row | undefined, key: string): string | undefined {
  const value = row?.[key]
  if (typeof value !== 'string' || value.length === 0) return undefined
  return value
}

function formatSize(bytes?: number): string {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return ''
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${Math.round(bytes / (1024 * 1024))} МБ`
}

function join(parts: Array<string | false | undefined>): string[] {
  return parts.filter((part): part is string => typeof part === 'string' && part.length > 0)
}

function truncate(value: string, limit = 80): string {
  return value.length > limit ? `${value.slice(0, limit)}...` : value
}

// Контекст строки очереди: заголовок и пояснения под ним.
export function describeRow(kind: QueueKind, row: Row): RowView {
  const id = text(row, 'id') ?? ''
  const fallbackTitle = id || 'Без идентификатора'

  if (kind === 'reports') {
    const reporterName = text(row.reporter as Row | undefined, 'fullName')
    const targetType = text(row, 'targetType')
    const targetId = text(row, 'targetId') ?? ''
    const comment = text(row, 'comment')

    return {
      title: text(row, 'reason') ?? fallbackTitle,
      lines: join([
        `Пожаловался: ${reporterName ?? 'пользователь'} - ${formatDate(text(row, 'createdAt') ?? '')}`,
        `Объект: ${(targetType && REPORT_TARGET_LABELS[targetType]) || targetType || '-'} ${targetId}`,
        comment && `Комментарий: ${comment}`,
      ]),
    }
  }

  if (kind === 'profiles') {
    const age = typeof row.age === 'number' ? row.age : undefined
    return {
      title: text(row, 'name') ?? text(row, 'slug') ?? fallbackTitle,
      lines: join([
        age !== undefined && `Возраст: ${age}`,
        text(row, 'city') && `Город: ${text(row, 'city')}`,
        text(row, 'about'),
      ]),
    }
  }

  if (kind === 'products') {
    const profileName = text(row.childProfile as Row | undefined, 'name')
    const price = typeof row.priceKopecks === 'number' ? row.priceKopecks : undefined
    return {
      title: text(row, 'title') ?? (profileName ? `Товар профиля ${profileName}` : fallbackTitle),
      lines: join([
        profileName && `Профиль: ${profileName}`,
        price !== undefined && `Цена: ${formatPrice(price)}`,
        text(row, 'description'),
      ]),
    }
  }

  if (kind === 'media') {
    return {
      title: text(row, 'mimeType') ?? fallbackTitle,
      lines: join([
        text(row, 'kind') && `Тип: ${text(row, 'kind')}`,
        formatSize(row.sizeBytes as number | undefined) &&
          `Размер: ${formatSize(row.sizeBytes as number | undefined)}`,
        text(row, 'ownerType') &&
          `Владелец: ${text(row, 'ownerType')} ${text(row, 'ownerId') ?? ''}`,
      ]),
    }
  }

  const authorName = text(row.author as Row | undefined, 'fullName')
  const rating = typeof row.rating === 'number' ? row.rating : undefined
  const reviewText = text(row, 'text')

  return {
    title: reviewText ? truncate(reviewText) : fallbackTitle,
    lines: join([
      authorName && `Автор: ${authorName}`,
      rating !== undefined && `Оценка: ${rating} из 5`,
    ]),
  }
}
