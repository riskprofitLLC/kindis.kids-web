import { useState } from 'react'

import { useMediaUrl } from '@/features/media/model/use-media-url'
import { Lightbox } from '@/shared/ui/lightbox/lightbox'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

interface ProductGalleryProps {
  title: string
  photoMediaIds: string[]
}

// Галерея товара: главное фото, миниатюры, зум, лайтбокс со стрелками клавиатурой.
export function ProductGallery({ title, photoMediaIds }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  const activeMediaId = photoMediaIds[activeIndex]
  const activeUrl = useMediaUrl(activeMediaId ?? undefined)

  if (photoMediaIds.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-card border border-border bg-surface-muted text-sm text-text-muted">
        Фото пока нет
      </div>
    )

    return (
      <div className="flex flex-col gap-3">
        <div className="relative overflow-hidden rounded-card border border-border">
          {activeUrl ? (
            <button
              type="button"
              className="block w-full min-h-11 cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
              aria-label="Открыть фото крупно"
            >
              <img
                src={activeUrl ?? undefined}
                alt={title}
                className={`aspect-square w-full object-cover transition-transform ${zoomed ? 'scale-150' : ''}`}
              />
            </button>
          ) : (
            <Skeleton className="aspect-square w-full rounded-none" />
          )}
          <button
            type="button"
            className="absolute bottom-2 right-2 min-h-11 rounded-md border border-border bg-surface px-3 text-sm"
            onClick={() => setZoomed((value) => !value)}
            aria-pressed={zoomed}
          >
            {zoomed ? 'Уменьшить' : 'Увеличить'}
          </button>
        </div>

        {/* Миниатюры — до 30 фото товара */}
        {photoMediaIds.length > 1 && (
          <ul className="grid grid-cols-6 gap-2">
            {photoMediaIds.map((mediaId, index) => (
              <li key={mediaId}>
                <ThumbnailButton
                  mediaId={mediaId}
                  active={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                />
              </li>
            ))}
          </ul>
        )}

        <Lightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          title={title}
          onPrev={() =>
            setActiveIndex((index) => (index - 1 + photoMediaIds.length) % photoMediaIds.length)
          }
          onNext={() => setActiveIndex((index) => (index + 1) % photoMediaIds.length)}
        >
          {activeUrl && (
            <img
              src={activeUrl ?? undefined}
              alt={title}
              className="max-h-[70vh] w-full object-contain"
            />
          )}
        </Lightbox>
      </div>
    )
  }

  interface ThumbnailButtonProps {
    mediaId: string
    active: boolean
    onClick: () => void
  }

  function ThumbnailButton({ mediaId, active, onClick }: ThumbnailButtonProps) {
    const url = useMediaUrl(mediaId)

    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={active}
        className={`block w-full overflow-hidden rounded-md border ${active ? 'border-primary' : 'border-border'}`}
      >
        {url ? (
          <img src={url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
        ) : (
          <Skeleton className="aspect-square w-full rounded-none" />
        )}
      </button>
    )
  }
}
