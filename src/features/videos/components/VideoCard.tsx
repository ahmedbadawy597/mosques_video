import { useEffect, useRef, useState } from 'react'
import {
  VideoPlayer,
  type VideoPlayerHandle,
} from '@/components/media/VideoPlayer'
import { APP_CONFIG } from '@/config/app'
import { isSpecified } from '@/utils/isSpecified'
import { toSafeHref } from '@/utils/safeUrl'
import type { VideoRecord } from '../types'
import './video-card.css'

interface VideoCardProps {
  video: VideoRecord
}

export function VideoCard({ video }: VideoCardProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const playerRef = useRef<VideoPlayerHandle | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = rootRef.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      setActive(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { rootMargin: '240px 0px', threshold: 0.01 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const mapHref = isSpecified(video.mapUrl) ? toSafeHref(video.mapUrl) : null
  const storyHref = isSpecified(video.storyUrl) ? toSafeHref(video.storyUrl) : null

  return (
    <article ref={rootRef} className="video-card surface-card">
      <VideoPlayer
        ref={playerRef}
        id={video.id}
        name={video.name}
        videoUrl={video.videoUrl}
        videoType={video.videoType}
        storyUrl={video.storyUrl}
        governorate={video.governorate || APP_CONFIG.unspecified}
        active={active}
      />

      <div className="video-card-body">
        <div>
          <h3>{video.name || APP_CONFIG.unspecified}</h3>
          <p>
            <i className="fa-regular fa-calendar-days" aria-hidden />
            تاريخ التصوير: {video.date || APP_CONFIG.unspecified}
          </p>
        </div>

        <div className="video-card-actions">
          {mapHref ? (
            <a className="btn btn-soft" href={mapHref} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-location-dot" aria-hidden />
              موقع جوجل ماب
            </a>
          ) : (
            <span className="btn btn-muted" aria-disabled="true">
              <i className="fa-solid fa-location-dot" aria-hidden />
              {APP_CONFIG.unspecified}
            </span>
          )}

          {storyHref ? (
            <a className="btn btn-gold" href={storyHref} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-book-open" aria-hidden />
              فتح خريطة القصة
            </a>
          ) : null}

          <button
            type="button"
            className="btn btn-soft"
            onClick={() => playerRef.current?.requestFullscreen()}
            disabled={!active}
          >
            <i className="fa-solid fa-expand" aria-hidden />
            ملء الشاشة
          </button>
        </div>
      </div>
    </article>
  )
}
