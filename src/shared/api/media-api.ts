import axios from 'axios'

import { api } from '@/shared/api/client'

// uploading — файл в хранилище, processing — видео сжимается, ready — готово.
export type MediaStatus = 'uploading' | 'processing' | 'ready' | 'failed'

export interface MediaAsset {
  id: string
  ownerType: 'child_profile' | 'product' | 'review'
  ownerId: string
  kind: 'photo' | 'video'
  storageKey: string
  mimeType: string
  sizeBytes: number
  durationSeconds: number | null
  width: number | null
  height: number | null
  status: MediaStatus
  moderatedAt: string | null
}

export interface UploadTicket {
  mediaId: string
  uploadUrl: string
}

export const mediaApi = {
  // Прямая загрузка идёт в хранилище, минуя наш api-инстанс с базовым URL.
  async uploadToStorage(
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
      signal,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return
        onProgress(Math.round((event.loaded / event.total) * 100))
      },
    })
  },

  async requestUploadUrl(input: {
    ownerType: 'child_profile' | 'product'
    ownerId: string
    kind: 'photo' | 'video'
    fileName: string
    mimeType: string
    sizeBytes: number
  }): Promise<UploadTicket> {
    const { data } = await api.post<UploadTicket>('/media/upload-url', input)
    return data
  },

  async completeUpload(
    mediaId: string,
    meta?: { durationSeconds?: number; width?: number; height?: number },
  ): Promise<MediaAsset> {
    const { data } = await api.post<MediaAsset>(`/media/${mediaId}/complete`, meta ?? {})
    return data
  },

  // Публичная ссылка на чтение работает только для проверенного медиа.
  async getReadUrl(mediaId: string): Promise<string> {
    const { data } = await api.get<{ url: string }>(`/media/${mediaId}/url`)
    return data.url
  },

  // Ссылка для владельца: доступна до прохождения модерации — для кабинета.
  async getOwnerReadUrl(mediaId: string): Promise<string> {
    const { data } = await api.get<{ url: string }>(`/media/${mediaId}/owner-url`)
    return data.url
  },

  async remove(mediaId: string): Promise<void> {
    await api.delete(`/media/${mediaId}`)
  },
}
