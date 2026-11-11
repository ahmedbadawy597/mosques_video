import { EmptyState } from '@/components/common/EmptyState'
import type { VideoRecord } from '../types'
import { VideoCard } from './VideoCard'
import './video-card.css'

export function VideoGrid({ videos }: { videos: VideoRecord[] }) {
  if (videos.length === 0) {
    return <EmptyState title="لا توجد فيديوهات مطابقة للبحث" />
  }

  return (
    <div className="video-grid">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
