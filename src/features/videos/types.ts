export type VideoType = 'mp4' | 'youtube' | 'vimeo' | 'hls' | 'iframe'

export interface VideoRecord {
  id: string
  storyId: string
  name: string
  governorate: string
  date: string
  mapUrl: string
  videoUrl: string
  videoType: VideoType
  storyUrl: string
  isLocal?: boolean
}

export interface VideoFilters {
  search: string
  governorate: string
  date: string
}

export interface VideoStats {
  totalVideos: number
  uniqueGovernorates: number
  uniqueMosques: number
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'
