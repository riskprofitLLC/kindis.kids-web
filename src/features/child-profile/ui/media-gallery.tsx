import { useMemo, useState } from 'react'

import { readCachedMedia, removeCachedMedia } from '@/features/child-profile/model/media-cache'
import {
  moveMedia,
  readMediaLayout,
  setMainPhoto,
  sortByOrder,
  withMainFirst,
} from '@/features/child-profile/model/media-layout'
import {
  useDeleteProfileMedia,
  useProfileMedia,
} from '@/features/child-profile/model/use-profile-media'
import { MediaThumb, MediaViewer } from '@/features/child-profile/ui/media-thumb'
import type { MediaAsset, MediaStatus } from '@/shared/api/media-api'
import type { MediaKind } from '@/shared/domain/media'
import { formatDuration } from '@/shared/domain/media'
import { Badge } from '@/shared/ui/badge/badge'
import { Button } from '@/shared/ui/button/button'
import { Dialog } from '@/shared/ui/dialog/dialog'
import { Lightbox } from '@/shared/ui/lightbox/lightbox'

const STATUS_LABEL: Record<MediaStatus, string> = {
  uploading: 'Загружается',
  processing: 'Обрабатывается',
  ready: 'Готово',
  failed: 'Не удалось обработать',
}

const EMPTY_TEXT: Record<MediaKind, string> = {
  photo: 'Фото пока нет — загрузите до пяти снимков профиля.',
  video: 'Видео пока нет — загрузите ролик «как он делает».',
}

interface MediaGalleryProps {
  ownerId: string
  kind?: MediaKind
}

// Галерея медиа профиля: сетка, лайтбокс, порядок, главное фото, удаление.
// Сервер — источник правды; локальный кеш подключается, когда API недоступен.
export function MediaGallery({ ownerId, kind }: MediaGalleryProps) {
  const media = useProfileMedia(ownerId)
  const removeMutation = useDeleteProfileMedia(ownerId)
  const [layout, setLayout] = useState(() => readMediaLayout(ownerId))
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null)

  const assets = useMemo(() => {
    const source = media.data ?? readCachedMedia(ownerId)
    const ofKind = source.filter((asset) => !kind || asset.kind === kind)
    const order = kind === 'video' ? layout.videoOrder : layout.photoOrder
    return withMainFirst(sortByOrder(ofKind, order), kind === 'photo' ? layout.mainPhotoId : null)
  }, [media.data, ownerId, kind, layout])

  if (media.isPending && assets.length === 0) {
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={index} className="aspect-square rounded bg-surface-muted" />
        ))}
      </ul>
    )
  }

  if (assets.length === 0) {
    return <p className="text-sm text-text-muted">{EMPTY_TEXT[kind ?? 'photo']}</p>
  }

  const active = activeIndex === null ? null : assets[activeIndex]
  const displayedIds = assets.map((asset) => asset.id)

  return (
    <section className="flex flex-col gap-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {assets.map((asset, index) => {
          const isMain = layout.mainPhotoId === asset.id

          return (
            <li key={asset.id} className="rounded-card border border-border p-2">
              <button
                type="button"
                className="block w-full min-h-11 text-left"
                onClick={() => setActiveIndex(index)}
              >
                <MediaThumb asset={asset} />
              </button>

              <div className="mt-2 flex flex-wrap items-center gap-1">
                <Badge variant={asset.status === 'ready' ? 'secondary' : 'default'}>
                  {STATUS_LABEL[asset.status]}
                </Badge>
                {isMain && <Badge variant="success">Главное</Badge>}
                {!asset.moderatedAt && <Badge variant="secondary">На проверке</Badge>}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1">
                {kind === 'photo' && !isMain && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLayout(setMainPhoto(ownerId, asset.id))}
                  >
                    Сделать главным
                  </Button>
                )}
                {kind !== undefined && assets.length > 1 && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Переместить влево"
                      disabled={index === 0}
                      onClick={() =>
                        setLayout(moveMedia(ownerId, kind, asset.id, 'left', displayedIds))
                      }
                    >
                      ←
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Переместить вправо"
                      disabled={index === assets.length - 1}
                      onClick={() =>
                        setLayout(moveMedia(ownerId, kind, asset.id, 'right', displayedIds))
                      }
                    >
                      →
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDelete(asset)}
                >
                  Удалить
                </Button>
              </div>
              {asset.durationSeconds !== null && (
                <p className="mt-1 text-xs text-text-muted">
                  {formatDuration(asset.durationSeconds)}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <Lightbox
        open={active !== null}
        onOpenChange={(open) => !open && setActiveIndex(null)}
        title={active ? `${active.kind === 'photo' ? 'Фото' : 'Видео'} профиля` : ''}
        onPrev={() =>
          setActiveIndex((current) =>
            current === null ? null : (current - 1 + assets.length) % assets.length,
          )
        }
        onNext={() =>
          setActiveIndex((current) => (current === null ? null : (current + 1) % assets.length))
        }
      >
        {active && <MediaViewer asset={active} />}
      </Lightbox>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Удалить файл?"
        description="Файл исчезнет из профиля и витрины. Действие необратимо."
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
            Оставить
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={removeMutation.isPending}
            onClick={() => {
              if (!pendingDelete) return
              const mediaId = pendingDelete.id
              setPendingDelete(null)
              removeCachedMedia(ownerId, mediaId)
              removeMutation.mutate(mediaId)
            }}
          >
            Удалить
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
