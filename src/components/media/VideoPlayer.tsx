import { useState } from 'react'
import { isSpecified } from '@/utils/isSpecified'
import { toSafeHref } from '@/utils/safeUrl'
import type { VideoType } from '@/features/videos/types'
import './video-player.css'

interface VideoPlayerProps {
  id: string
  name: string
  videoUrl: string
  videoType: VideoType
  storyUrl: string
  governorate: string
  active: boolean
  showGovernorate?: boolean
}

export function VideoPlayer({
  name,
  videoUrl,
  videoType,
  storyUrl,
  governorate,
  active,
  showGovernorate = true,
}: VideoPlayerProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const safeVideo = toSafeHref(videoUrl)
  const safeStory = isSpecified(storyUrl) ? toSafeHref(storyUrl) : null
  const failed = !safeVideo || failedUrl === videoUrl

  const isEmbed =
    videoType === 'youtube' || videoType === 'vimeo' || videoType === 'iframe'

  return (
    <div className="video-player">
      {active && safeVideo && !failed ? (
        isEmbed ? (
          <iframe
            className="video-frame"
            src={safeVideo}
            title={name}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onError={() => setFailedUrl(videoUrl)}
          />
        ) : (
          <video
            className="video-el"
            controls
            preload="metadata"
            playsInline
            onError={() => setFailedUrl(videoUrl)}
          >
            <source
              src={safeVideo}
              type={videoType === 'hls' ? 'application/x-mpegURL' : 'video/mp4'}
            />
          </video>
        )
      ) : (
        <div className="video-placeholder" aria-hidden>
          <i className="fa-solid fa-play" />
        </div>
      )}

      {showGovernorate ? <div className="gov-chip">{governorate}</div> : null}

      {failed ? (
        <div className="video-error">
          <i className="fa-solid fa-circle-exclamation" aria-hidden />
          <p>تعذر تشغيل الفيديو مباشرة</p>
          {safeStory ? (
            <a
              className="btn btn-primary"
              href={safeStory}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden />
              افتح القصة
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
