import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { isSpecified } from '@/utils/isSpecified'
import { toSafeHref } from '@/utils/safeUrl'
import type { VideoType } from '@/features/videos/types'
import './video-player.css'

export interface VideoPlayerHandle {
  requestFullscreen: () => void
  canFullscreen: boolean
}

interface VideoPlayerProps {
  id: string
  name: string
  videoUrl: string
  videoType: VideoType
  storyUrl: string
  governorate: string
  active: boolean
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    { name, videoUrl, videoType, storyUrl, governorate, active },
    ref,
  ) {
    const mediaRef = useRef<HTMLVideoElement | HTMLIFrameElement | null>(null)
    const [failedUrl, setFailedUrl] = useState<string | null>(null)
    const safeVideo = toSafeHref(videoUrl)
    const safeStory = isSpecified(storyUrl) ? toSafeHref(storyUrl) : null
    const failed = !safeVideo || failedUrl === videoUrl
    const canFullscreen = Boolean(active && safeVideo && !failed)

    useImperativeHandle(
      ref,
      () => ({
        canFullscreen,
        requestFullscreen: () => {
          const el = mediaRef.current
          if (!el) return
          const req =
            el.requestFullscreen?.bind(el) ||
            (
              el as HTMLVideoElement & {
                webkitRequestFullscreen?: () => Promise<void>
              }
            ).webkitRequestFullscreen?.bind(el)
          void req?.()
        },
      }),
      [canFullscreen],
    )

    const isEmbed =
      videoType === 'youtube' || videoType === 'vimeo' || videoType === 'iframe'

    return (
      <div className="video-player">
        {active && safeVideo && !failed ? (
          isEmbed ? (
            <iframe
              ref={(node) => {
                mediaRef.current = node
              }}
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
              ref={(node) => {
                mediaRef.current = node
              }}
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

        <div className="gov-chip">{governorate}</div>

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
  },
)
