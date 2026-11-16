import { Link } from 'react-router-dom'

import { useProfileMedia } from '@/features/child-profile/model/use-profile-media'
import { MediaThumb } from '@/features/child-profile/ui/media-thumb'
import type { ChildProfile } from '@/shared/api/children-api'
import { routes } from '@/shared/config/routes'
import { Badge } from '@/shared/ui/badge/badge'
import { Button } from '@/shared/ui/button/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'

interface PublicPreviewProps {
  profile: ChildProfile
}

// Предпросмотр публичной витрины: те же поля и медиа, что увидит покупатель.
export function PublicPreview({ profile }: PublicPreviewProps) {
  const media = useProfileMedia(profile.id)
  const assets = media.data ?? []
  const photos = assets.filter((asset) => asset.kind === 'photo')
  const videos = assets.filter((asset) => asset.kind === 'video')

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Предпросмотр витрины</CardTitle>
        {profile.status === 'active' && (
          <Button asChild variant="outline" size="sm">
            <Link to={routes.seller(profile.slug)}>Открыть публичную страницу</Link>
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface-muted">
            {photos[0] && <MediaThumb asset={photos[0]} />}
          </div>

          <div className="min-w-0">
            <p className="font-medium text-text">
              {profile.name}, {profile.age}
            </p>
            {profile.city && <p className="text-sm text-text-muted">{profile.city}</p>}
            <p className="text-xs text-text-muted">Адрес страницы: {routes.seller(profile.slug)}</p>
          </div>
        </div>

        {profile.about && <p className="text-sm text-text">{profile.about}</p>}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((asset) => (
              <div key={asset.id} className="overflow-hidden rounded">
                <MediaThumb asset={asset} />
              </div>
            ))}
          </div>
        )}

        {videos.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {videos.map((asset) => (
              <li key={asset.id} className="w-40">
                <MediaThumb asset={asset} />
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={profile.status === 'active' ? 'success' : 'secondary'}>
            {profile.status === 'active' ? 'Опубликован' : 'Не опубликован'}
          </Badge>
          <span className="text-xs text-text-muted">
            Фото и видео появятся на витрине после проверки модератором.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
