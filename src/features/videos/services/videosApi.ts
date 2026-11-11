import { APP_CONFIG } from '@/config/app'
import type { VideoRecord } from '../types'
import { normalizeVideoCatalog } from '../utils/validateVideo'

export async function fetchVideoCatalog(
  signal?: AbortSignal,
): Promise<VideoRecord[]> {
  const response = await fetch(APP_CONFIG.catalogUrl, {
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    throw new Error(`تعذر تحميل ملف videos.json (HTTP ${response.status})`)
  }

  const data: unknown = await response.json()
  return normalizeVideoCatalog(data)
}
