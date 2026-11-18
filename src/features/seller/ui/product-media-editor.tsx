import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { renewMediaUrl, useMediaUrl } from '@/features/media/model/use-media-url'
import { mediaApi } from '@/shared/api/media-api'
import { PRODUCT_MEDIA_LIMIT, productsApi } from '@/shared/api/products-api'
import { Alert } from '@/shared/ui/alert/alert'
import { Badge } from '@/shared/ui/badge/badge'
import { Button } from '@/shared/ui/button/button'

interface ProductMediaEditorProps {
  productId: string
}

// Редактор медиа товара: загрузка до 30 фото,порядок,главное,отвязка.
export function ProductMediaEditor({ productId }: ProductMediaEditorProps) {
  const queryClient = useQueryClient()
  const [order, setOrder] = useState<string[]>([])

  const media = useQuery({
    queryKey: ['product-media', productId],
    queryFn: () => productsApi.media(productId),
  })

  const rows = media.data ?? []
  const currentOrder = order.length > 0 ? order : rows.map((row) => row.mediaId)

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['product-media', productId] })

  // Загрузка:билет → хранилище → complete → привязка к товару.
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const ticket = await mediaApi.requestUploadUrl({
        ownerType: 'product',
        ownerId: productId,
        kind: 'photo',
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      })

      await mediaApi.uploadToStorage(ticket.uploadUrl, file)
      await mediaApi.completeUpload(ticket.mediaId)
      return productsApi.attachMedia(productId, ticket.mediaId)
    },
    onSuccess: invalidate,
  })

  const saveOrder = useMutation({
    mutationFn: (mediaIds: string[]) => productsApi.reorderMedia(productId, mediaIds),
    onSuccess: () => {
      setOrder([])
      invalidate()
    },
  })

  const detach = useMutation({
    mutationFn: (mediaId: string) => productsApi.detachMedia(productId, mediaId),
    onSuccess: invalidate,
  })

  // Перемещение фото влево/вправо — порядок сразу на сервере.
  const move = (mediaId: string, direction: -1 | 1) => {
    const index = currentOrder.indexOf(mediaId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= currentOrder.length) return

    const next = [...currentOrder]
    next.splice(index, 1)
    next.splice(target, 0, mediaId)
    setOrder(next)
    saveOrder.mutate(next)
  }

  const atLimit = rows.length >= PRODUCT_MEDIA_LIMIT

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text">
          Фото товара ({rows.length}/{PRODUCT_MEDIA_LIMIT})
        </h2>
        <label className="text-sm text-text">
          <input
            type="file"
            accept="image/*"
            disabled={atLimit || upload.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) upload.mutate(file)
              event.target.value = ''
            }}
          />
          <span className="text-xs text-text-muted">
            {upload.isPending ? 'Загружаем…' : atLimit ? 'Лимит достигнут' : 'Добавить фото'}
          </span>
        </label>
      </div>

      {upload.isError && (
        <Alert variant="danger" title="Не удалось загрузить фото">
          Проверьте формат и размер файла и попробуйте снова.
        </Alert>
      )}

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {currentOrder.map((mediaId, index) => (
          <li key={mediaId} className="flex flex-col gap-1">
            <MediaThumbBox mediaId={mediaId} />
            {index === 0 && <Badge variant="success">Главное</Badge>}
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Переместить влево"
                disabled={index === 0}
                onClick={() => move(mediaId, -1)}
              >
                ←
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Переместить вправо"
                disabled={index === currentOrder.length - 1}
                onClick={() => move(mediaId, 1)}
              >
                →
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={detach.isPending}
                onClick={() => detach.mutate(mediaId)}
              >
                Удалить
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Миниатюра медиа по id — ссылку резолвим через /media/:id/url.
function MediaThumbBox({ mediaId }: { mediaId: string }) {
  const url = useMediaUrl(mediaId)

  if (!url) {
    return <div className="aspect-square rounded bg-surface-muted" aria-hidden="true" />
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => void renewMediaUrl(mediaId)}
      className="aspect-square w-full rounded object-cover"
    />
  )
}
