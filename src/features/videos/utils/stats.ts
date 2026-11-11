import { isSpecified } from '@/utils/isSpecified'
import type { VideoRecord, VideoStats } from '../types'

export function computeVideoStats(videos: VideoRecord[]): VideoStats {
  const uniqueGovernorates = new Set(
    videos.map((v) => v.governorate).filter((g) => isSpecified(g)),
  )
  const uniqueMosques = new Set(
    videos.map((v) => v.name.trim()).filter(Boolean),
  )

  return {
    totalVideos: videos.length,
    uniqueGovernorates: uniqueGovernorates.size,
    uniqueMosques: uniqueMosques.size,
  }
}
