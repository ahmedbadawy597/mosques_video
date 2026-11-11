import { useMemo, useState } from 'react'
import { useVideos } from '@/app/providers/VideosProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/Button'
import { HomeFilters } from '@/features/videos/components/HomeFilters'
import { StatsCards } from '@/features/videos/components/StatsCards'
import { VideoGrid } from '@/features/videos/components/VideoGrid'
import { useVideoFilters } from '@/features/videos/hooks/useVideoFilters'
import '@/features/videos/components/filters.css'

export function HomePage() {
  const { videos, status, error, stats, reload } = useVideos()
  const [search, setSearch] = useState('')
  const [governorate, setGovernorate] = useState('')

  const filters = useMemo(
    () => ({ search, governorate, date: '' }),
    [search, governorate],
  )
  const filtered = useVideoFilters(videos, filters)

  if (status === 'loading' || status === 'idle') {
    return <LoadingState />
  }

  if (status === 'error') {
    return (
      <EmptyState
        icon="fa-triangle-exclamation"
        title="تعذر تحميل بيانات الفيديوهات"
        description={error ?? 'تحقق من وجود videos.json وشغّل المنصة عبر Vite.'}
        action={
          <Button onClick={() => void reload()}>
            <i className="fa-solid fa-rotate" aria-hidden />
            إعادة المحاولة
          </Button>
        }
      />
    )
  }

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      <StatsCards stats={stats} />
      <HomeFilters
        search={search}
        governorate={governorate}
        onSearchChange={setSearch}
        onGovernorateChange={setGovernorate}
        count={filtered.length}
        total={videos.length}
      />
      <section className="home-videos-section" aria-label="قائمة الفيديوهات">
        <div className="home-videos-head">
          <h3>
            <i className="fa-solid fa-film" aria-hidden />
            فيديوهات التصوير الجوي للمساجد
          </h3>
          <span className="home-videos-count">{filtered.length} نتيجة</span>
        </div>
        <VideoGrid videos={filtered} />
      </section>
    </div>
  )
}
