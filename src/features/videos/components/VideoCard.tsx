import { useEffect, useRef, useState } from 'react'
import { VideoPlayer } from '@/components/media/VideoPlayer'
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
  const governorate = video.governorate || APP_CONFIG.unspecified
  const dateLabel = video.date || APP_CONFIG.unspecified

  return (
    <article ref={rootRef} className="video-card">
      <div className="video-card-media">
        <VideoPlayer
          id={video.id}
          name={video.name}
          videoUrl={video.videoUrl}
          videoType={video.videoType}
          storyUrl={video.storyUrl}
          governorate={governorate}
          active={active}
          showGovernorate={false}
        />
      </div>

      <div className="video-card-body">
        <p className="video-card-eyebrow">{governorate}</p>
        <h3 className="video-card-title">
          {video.name || APP_CONFIG.unspecified}
        </h3>

        <dl className="video-card-facts">
          <div>
            <dt>تاريخ التصوير</dt>
            <dd>{dateLabel}</dd>
          </div>
        </dl>

        <div className="video-card-actions" role="group" aria-label="روابط المسجد">
          {mapHref ? (
            <a
              className="video-btn video-btn-secondary"
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-solid fa-location-dot" aria-hidden />
              عرض الموقع
            </a>
          ) : (
            <span className="video-btn video-btn-secondary is-disabled" aria-disabled="true">
              <i className="fa-solid fa-location-dot" aria-hidden />
              غير متاح
            </span>
          )}

          {storyHref ? (
            <a
              className="video-btn video-btn-primary"
              href={storyHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-solid fa-book-open" aria-hidden />
              خريطة القصة
            </a>
          ) : (
            <span className="video-btn video-btn-primary is-disabled" aria-disabled="true">
              <i className="fa-solid fa-book-open" aria-hidden />
              غير متاح
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
