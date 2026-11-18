import { useMemo } from 'react'

import { useMyChildProfiles } from '@/features/child-profile/model/use-child-profile'
import { useProfileMedia } from '@/features/child-profile/model/use-profile-media'
import { MediaGallery } from '@/features/child-profile/ui/media-gallery'
import { MediaUploader } from '@/features/child-profile/ui/media-uploader'
import { ProfileEditor } from '@/features/child-profile/ui/profile-editor'
import type { ChildProfile } from '@/shared/api/children-api'
import { MEDIA_LIMITS } from '@/shared/domain/media'
import { Alert } from '@/shared/ui/alert/alert'
import { Badge } from '@/shared/ui/badge/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

import { PublicPreview } from './public-preview'

const STATUS_NOTICE: Record<ChildProfile['status'], string> = {
  draft: 'Профиль — черновик. Заполните поля, загрузите фото и отправьте на модерацию.',
  pending_review: 'Профиль на проверке у модератора. После одобрения его увидят покупатели.',
  active: 'Профиль опубликован и виден покупателям.',
  blocked: 'Профиль заблокирован модератором. Напишите в поддержку, чтобы разобраться.',
}

// Кабинет продавца: профиль ребёнка, медиа и предпросмотр витрины
export default function ChildProfilePage() {
  const profiles = useMyChildProfiles()
  const profile = profiles.data?.[0] ?? null
  const media = useProfileMedia(profile?.id ?? null)

  const photoCount = useMemo(
    () => (media.data ?? []).filter((asset) => asset.kind === 'photo').length,
    [media.data],
  )
  const videoCount = useMemo(
    () => (media.data ?? []).filter((asset) => asset.kind === 'video').length,
    [media.data],
  )

  if (profiles.isPending) {
    return (
      <div aria-busy="true" className="space-y-4">
        <span className="sr-only">Загружаем…</span>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (profiles.isError) {
    return <Alert variant="danger">Не удалось загрузить профиль. Обновите страницу.</Alert>
  }

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Профиль ребёнка</h1>

      {profile && <Alert variant="info">{STATUS_NOTICE[profile.status]}</Alert>}

      <ProfileEditor profile={profile} />

      {profile && (
        <>
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Фото профиля</CardTitle>
              <Badge variant="secondary">
                {photoCount} из {MEDIA_LIMITS.childPhotoLimit}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <MediaUploader
                ownerId={profile.id}
                kind="photo"
                limit={MEDIA_LIMITS.childPhotoLimit}
                currentCount={photoCount}
              />
              <MediaGallery ownerId={profile.id} kind="photo" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Видео «Как он делает»</CardTitle>
              {videoCount > 0 && <Badge variant="secondary">{videoCount}</Badge>}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-muted">
                До {MEDIA_LIMITS.maxVideoSeconds} секунд, формат mp4 или webm. После загрузки видео
                сжимается — статус виден в галерее ниже.
              </p>
              <MediaUploader ownerId={profile.id} kind="video" />
              <MediaGallery ownerId={profile.id} kind="video" />
            </CardContent>
          </Card>

          <PublicPreview profile={profile} />
        </>
      )}
    </section>
  )
}
