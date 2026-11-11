import type { VideoRecord, VideoType } from '../types'

const VIDEO_TYPES = new Set<VideoType>([
  'mp4',
  'youtube',
  'vimeo',
  'hls',
  'iframe',
])

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

export function normalizeVideoRecord(
  raw: unknown,
  index: number,
): VideoRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>

  const videoUrl = asString(item.videoUrl)
  const name = asString(item.name)
  if (!videoUrl || !name) return null

  const videoTypeRaw = asString(item.videoType, 'mp4').toLowerCase()
  const videoType = VIDEO_TYPES.has(videoTypeRaw as VideoType)
    ? (videoTypeRaw as VideoType)
    : 'mp4'

  return {
    id: asString(item.id) || `video-${index}`,
    storyId: asString(item.storyId) || 'غير محدد',
    name,
    governorate: asString(item.governorate) || 'غير محدد',
    date: asString(item.date) || 'غير محدد',
    mapUrl: asString(item.mapUrl) || 'غير محدد',
    videoUrl,
    videoType,
    storyUrl: asString(item.storyUrl) || 'غير محدد',
    isLocal: Boolean(item.isLocal),
  }
}

export function normalizeVideoCatalog(data: unknown): VideoRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('صيغة videos.json غير صحيحة — يجب أن تكون مصفوفة')
  }

  return data
    .map((item, index) => normalizeVideoRecord(item, index))
    .filter((item): item is VideoRecord => item !== null)
}
