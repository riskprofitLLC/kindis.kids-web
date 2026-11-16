// Web-only утилиты для превью видео: длительность и кадр-постер.

function createVideo(url: string): HTMLVideoElement {
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  video.src = url
  return video
}

// Длительность видео в секундах до отправки на сервер.
export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = createVideo(url)
    const cleanup = () => URL.revokeObjectURL(url)

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : 0
      cleanup()
      resolve(duration)
    }
    video.onerror = () => {
      cleanup()
      reject(new Error('Не удалось прочитать видео'))
    }
  })
}

// Кадр-постер из середины ролика для галереи и плеера.
export function captureVideoFrame(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = createVideo(url)
    const cleanup = () => URL.revokeObjectURL(url)

    video.onloadeddata = () => {
      const at = Number.isFinite(video.duration) ? Math.min(1, video.duration / 3) : 0
      video.currentTime = at
    }
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 180
        const context = canvas.getContext('2d')
        if (!context) {
          cleanup()
          resolve(null)
          return
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      } catch {
        resolve(null)
      } finally {
        cleanup()
      }
    }
    video.onerror = () => {
      cleanup()
      resolve(null)
    }
  })
}
