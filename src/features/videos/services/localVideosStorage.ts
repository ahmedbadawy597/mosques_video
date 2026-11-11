import { APP_CONFIG } from '@/config/app'
import type { VideoRecord } from '../types'
import { normalizeVideoRecord } from '../utils/validateVideo'

function isUsableVideoUrl(url: string): boolean {
  if (!url) return false
  // Blob URLs from previous sessions are invalid after reload
  if (url.startsWith('blob:')) return false
  return true
}

export function loadExtraVideos(): VideoRecord[] {
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKey)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item, index) => normalizeVideoRecord(item, index))
      .filter((item): item is VideoRecord => item !== null)
      .map((item) =>
        isUsableVideoUrl(item.videoUrl)
          ? item
          : {
              ...item,
              videoUrl: '',
            },
      )
  } catch {
    return []
  }
}

export function saveExtraVideos(videos: VideoRecord[]): void {
  const persistable = videos.map((video) => {
    if (video.videoUrl.startsWith('blob:')) {
      // Keep metadata; blob cannot survive reloads
      return { ...video, videoUrl: '' }
    }
    return video
  })
  localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(persistable))
}

export function loadDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(APP_CONFIG.deletedKey)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
  } catch {
    return []
  }
}

export function saveDeletedIds(ids: string[]): void {
  localStorage.setItem(APP_CONFIG.deletedKey, JSON.stringify([...new Set(ids)]))
}

export function mergeCatalogWithExtras(
  catalog: VideoRecord[],
  extras: VideoRecord[],
  deletedIds: string[] = [],
): VideoRecord[] {
  const deleted = new Set(deletedIds)
  const byId = new Map<string, VideoRecord>()
  for (const item of catalog) {
    if (!deleted.has(item.id)) byId.set(item.id, item)
  }
  for (const item of extras) {
    if (!deleted.has(item.id)) byId.set(item.id, item)
  }
  return Array.from(byId.values())
}
