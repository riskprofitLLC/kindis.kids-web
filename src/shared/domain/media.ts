// Доменные правила медиа: лимиты и валидация без DOM — общие с RN.
// Значения зеркалят конфиг бэкенда (MEDIA_*), чтобы отсеять плохой файл до запроса.

export const mediaKinds = ['photo', 'video'] as const
export type MediaKind = (typeof mediaKinds)[number]

export const MEDIA_LIMITS = {
  photoMime: ['image/jpeg', 'image/png', 'image/webp'],
  videoMime: ['video/mp4', 'video/webm'],
  maxPhotoBytes: 10 * 1024 * 1024,
  maxVideoBytes: 300 * 1024 * 1024,
  maxVideoSeconds: 180,
  childPhotoLimit: 5,
} as const

export interface MediaFileLike {
  name: string
  type: string
  size: number
}

export interface MediaValidationOk {
  ok: true
}

export interface MediaValidationError {
  ok: false
  message: string
}

// Проверка файла до отправки: формат и размер с понятным текстом.
export function validateMediaFile(
  kind: MediaKind,
  file: MediaFileLike,
): MediaValidationOk | MediaValidationError {
  const allowed: string[] =
    kind === 'photo' ? [...MEDIA_LIMITS.photoMime] : [...MEDIA_LIMITS.videoMime]

  if (!allowed.includes(file.type)) {
    return { ok: false, message: `Недопустимый формат. Подходят: ${allowed.join(', ')}` }
  }

  const limit = kind === 'photo' ? MEDIA_LIMITS.maxPhotoBytes : MEDIA_LIMITS.maxVideoBytes
  if (file.size > limit) {
    const limitMb = Math.round(limit / 1024 / 1024)
    return { ok: false, message: `Файл больше ${limitMb} МБ` }
  }

  return { ok: true }
}

// Длительность в виде м:сс — для плеера и галереи.
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// Человекочитаемый размер файла.
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}
