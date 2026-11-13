import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { VideoPlayer } from '@/components/media/VideoPlayer'
import { GOVERNORATES } from '@/constants/governorates'
import { useVideos } from '@/app/providers/VideosProvider'
import { useVideoFilters } from '@/features/videos/hooks/useVideoFilters'
import type { VideoRecord } from '@/features/videos/types'
import { downloadCsv, videosToCsv } from '@/features/videos/utils/csv'
import { computeVideoStats } from '@/features/videos/utils/stats'
import { ReportDocument } from './ReportDocument'
import '../styles/reports.css'

function formatArabicDate(date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch {
    return date.toLocaleDateString('ar-EG')
  }
}

function stampFilename(prefix: string): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${prefix}_${y}-${m}-${day}.csv`
}

export function ReportsPanel() {
  const { videos } = useVideos()
  const [search, setSearch] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [date, setDate] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<VideoRecord | null>(null)

  const filters = useMemo(
    () => ({ search, governorate, date }),
    [search, governorate, date],
  )
  const filtered = useVideoFilters(videos, filters)
  const stats = useMemo(() => computeVideoStats(filtered), [filtered])
  const generatedAt = useMemo(() => formatArabicDate(), [])

  const hasActiveFilters = Boolean(search || governorate || date)

  const filterSummary = useMemo(() => {
    const parts: string[] = []
    if (governorate) parts.push(governorate)
    if (date) parts.push(`تاريخ التصوير: ${date}`)
    if (search.trim()) parts.push(`بحث: «${search.trim()}»`)
    return parts.length ? parts.join(' · ') : 'جميع السجلات دون فلترة'
  }, [governorate, date, search])

  const onExport = () => {
    downloadCsv(
      stampFilename('awqaf_mosques_aerial_report'),
      videosToCsv(filtered),
    )
  }

  const onResetFilters = () => {
    setSearch('')
    setGovernorate('')
    setDate('')
  }

  useEffect(() => {
    if (!previewOpen && !playingVideo) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (playingVideo) {
        setPlayingVideo(null)
        return
      }
      setPreviewOpen(false)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [previewOpen, playingVideo])

  return (
    <div className="reports-page">
      <section className="surface-card reports-toolbar no-print">
        <div className="reports-toolbar-head">
          <div className="reports-toolbar-copy">
            <p className="reports-kicker">مركز التقارير الرقمية</p>
            <h3>استعلامات وتقارير التصوير الجوي</h3>
            <p>
              فلترة السجلات، معاينة التقرير الرسمي، ثم الطباعة أو التصدير CSV.
            </p>
          </div>

          <div className="reports-actions" role="group" aria-label="إجراءات التقرير">
            <Button
              type="button"
              variant="gold"
              className="reports-action-btn"
              onClick={() => setPreviewOpen(true)}
              disabled={filtered.length === 0}
            >
              <span className="reports-action-icon" aria-hidden>
                <i className="fa-solid fa-eye" />
              </span>
              <span className="reports-action-text">
                <strong>معاينة التقرير</strong>
                <small>عرض النسخة الرسمية</small>
              </span>
            </Button>
            <Button
              type="button"
              variant="soft"
              className="reports-action-btn"
              onClick={() => window.print()}
              disabled={filtered.length === 0}
            >
              <span className="reports-action-icon" aria-hidden>
                <i className="fa-solid fa-print" />
              </span>
              <span className="reports-action-text">
                <strong>طباعة التقرير</strong>
                <small>نسخة ورقية للوزارة</small>
              </span>
            </Button>
            <Button
              type="button"
              className="reports-action-btn"
              onClick={onExport}
              disabled={filtered.length === 0}
            >
              <span className="reports-action-icon" aria-hidden>
                <i className="fa-solid fa-file-csv" />
              </span>
              <span className="reports-action-text">
                <strong>تصدير CSV</strong>
                <small>{filtered.length} سجل جاهز</small>
              </span>
            </Button>
          </div>
        </div>

        <div className="reports-filters">
          <div className="field">
            <label htmlFor="report-search">بحث بالكلمات المفتاحية</label>
            <input
              id="report-search"
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="اسم المسجد أو الملحقات..."
            />
          </div>
          <div className="field">
            <label htmlFor="report-gov">المحافظة</label>
            <select
              id="report-gov"
              className="select"
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
            >
              <option value="">جميع المحافظات</option>
              {GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="report-date">تاريخ التصوير</label>
            <input
              id="report-date"
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="reports-filter-reset">
            <Button
              type="button"
              variant="muted"
              onClick={onResetFilters}
              disabled={!hasActiveFilters}
            >
              <i className="fa-solid fa-rotate-left" aria-hidden />
              إعادة ضبط
            </Button>
          </div>
        </div>
      </section>

      <div className={previewOpen ? 'no-print' : undefined}>
        <ReportDocument
          videos={filtered}
          stats={stats}
          generatedAt={generatedAt}
          filterSummary={filterSummary}
          onOpenVideo={setPlayingVideo}
        />
      </div>

      {previewOpen ? (
        <div
          className="report-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-preview-title"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="report-preview-shell"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="report-preview-bar no-print">
              <div>
                <p className="reports-kicker">معاينة قبل الطباعة</p>
                <h3 id="report-preview-title">معاينة التقرير الرسمي</h3>
              </div>
              <div className="report-preview-bar-actions">
                <Button type="button" variant="soft" onClick={() => window.print()}>
                  <i className="fa-solid fa-print" aria-hidden />
                  طباعة
                </Button>
                <Button type="button" onClick={onExport}>
                  <i className="fa-solid fa-file-csv" aria-hidden />
                  تصدير
                </Button>
                <Button
                  type="button"
                  variant="muted"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="إغلاق المعاينة"
                >
                  <i className="fa-solid fa-xmark" aria-hidden />
                  إغلاق
                </Button>
              </div>
            </header>

            <div className="report-preview-stage">
              <div className="report-preview-paper">
                <ReportDocument
                  videos={filtered}
                  stats={stats}
                  generatedAt={generatedAt}
                  filterSummary={filterSummary}
                  preview
                  onOpenVideo={setPlayingVideo}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {playingVideo ? (
        <div
          className="report-video-backdrop no-print"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-video-title"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="report-video-shell surface-card"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="report-video-bar">
              <div>
                <p className="reports-kicker">تشغيل الفيديو</p>
                <h3 id="report-video-title">{playingVideo.name}</h3>
              </div>
              <Button
                type="button"
                variant="muted"
                onClick={() => setPlayingVideo(null)}
                aria-label="إغلاق الفيديو"
              >
                <i className="fa-solid fa-xmark" aria-hidden />
                إغلاق
              </Button>
            </header>
            <VideoPlayer
              id={playingVideo.id}
              name={playingVideo.name}
              videoUrl={playingVideo.videoUrl}
              videoType={playingVideo.videoType}
              storyUrl={playingVideo.storyUrl}
              governorate={playingVideo.governorate}
              active
              showGovernorate={false}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
