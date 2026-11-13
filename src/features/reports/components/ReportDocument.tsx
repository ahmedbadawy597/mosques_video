import { APP_CONFIG } from '@/config/app'
import type { VideoRecord, VideoStats } from '@/features/videos/types'
import { isSpecified } from '@/utils/isSpecified'
import { toSafeHref } from '@/utils/safeUrl'

interface ReportDocumentProps {
  videos: VideoRecord[]
  stats: VideoStats
  generatedAt: string
  filterSummary: string
  /** Compact paper-like preview styling */
  preview?: boolean
  onOpenVideo?: (video: VideoRecord) => void
}

export function ReportDocument({
  videos,
  stats,
  generatedAt,
  filterSummary,
  preview = false,
  onOpenVideo,
}: ReportDocumentProps) {
  return (
    <article
      className={`reports-doc surface-card${preview ? ' is-preview' : ''}`}
      aria-label="تقرير المساجد"
    >
      <header className="reports-doc-header">
        <div className="reports-doc-brand">
          <div className="reports-doc-seal">
            <img
              src={APP_CONFIG.logoUrl}
              alt=""
              width={56}
              height={56}
              decoding="async"
            />
          </div>
          <div>
            <p className="reports-doc-org">{APP_CONFIG.orgName}</p>
            <h2 className="reports-doc-title">{APP_CONFIG.title}</h2>
            <p className="reports-doc-subtitle">
              تقرير رسمي — فيديوهات التصوير الجوي للمساجد وملحقاتها
            </p>
          </div>
        </div>

        <dl className="reports-doc-meta">
          <div>
            <dt>تاريخ الإصدار</dt>
            <dd>{generatedAt}</dd>
          </div>
          <div>
            <dt>نطاق الاستعلام</dt>
            <dd>{filterSummary}</dd>
          </div>
          <div>
            <dt>إجمالي النتائج</dt>
            <dd>{videos.length} سجل</dd>
          </div>
        </dl>
      </header>

      <div className={`reports-kpi${preview ? '' : ' no-print'}`}>
        <div className="reports-kpi-item">
          <span>الفيديوهات</span>
          <strong>{stats.totalVideos}</strong>
        </div>
        <div className="reports-kpi-item">
          <span>المساجد</span>
          <strong>{stats.uniqueMosques}</strong>
        </div>
        <div className="reports-kpi-item">
          <span>المحافظات</span>
          <strong>{stats.uniqueGovernorates}</strong>
        </div>
      </div>

      <div className="reports-table-head">
        <h3>سجل النتائج التفصيلي</h3>
        <span className="reports-count-chip">{videos.length} نتيجة</span>
      </div>

      <div className="table-scroll">
        <table className="reports-table">
          <thead>
            <tr>
              <th scope="col">م</th>
              <th scope="col">اسم المسجد وملحقاته</th>
              <th scope="col">المحافظة</th>
              <th scope="col">تاريخ التصوير</th>
              <th scope="col">الموقع الجغرافي</th>
              <th scope="col">خريطة القصة</th>
              <th scope="col">الفيديو</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  لا توجد بيانات مطابقة لخيارات الاستعلام الحالية
                </td>
              </tr>
            ) : (
              videos.map((item, index) => {
                const mapHref = isSpecified(item.mapUrl)
                  ? toSafeHref(item.mapUrl)
                  : null
                const storyHref = isSpecified(item.storyUrl)
                  ? toSafeHref(item.storyUrl)
                  : null
                const videoHref = isSpecified(item.videoUrl)
                  ? toSafeHref(item.videoUrl)
                  : null

                return (
                  <tr key={item.id}>
                    <td className="reports-index">{index + 1}</td>
                    <td>
                      <span className="reports-mosque-name">{item.name}</span>
                    </td>
                    <td>
                      <span className="reports-gov-chip">{item.governorate}</span>
                    </td>
                    <td className="reports-date">{item.date}</td>
                    <td>
                      {mapHref ? (
                        <a
                          className="reports-link"
                          href={mapHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fa-solid fa-location-dot" aria-hidden />
                          فتح الخريطة
                        </a>
                      ) : (
                        <span className="muted">{APP_CONFIG.unspecified}</span>
                      )}
                    </td>
                    <td>
                      {storyHref ? (
                        <a
                          className="reports-link"
                          href={storyHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fa-solid fa-book-open" aria-hidden />
                          StoryMap
                        </a>
                      ) : (
                        <span className="muted">{APP_CONFIG.unspecified}</span>
                      )}
                    </td>
                    <td>
                      {videoHref ? (
                        <>
                          {onOpenVideo ? (
                            <button
                              type="button"
                              className="reports-video-btn no-print"
                              onClick={() => onOpenVideo(item)}
                            >
                              <i className="fa-solid fa-play" aria-hidden />
                              فتح الفيديو
                            </button>
                          ) : null}
                          <a
                            className={`reports-link${onOpenVideo ? ' print-only' : ''}`}
                            href={videoHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fa-solid fa-play" aria-hidden />
                            فتح الفيديو
                          </a>
                        </>
                      ) : (
                        <span className="muted">{APP_CONFIG.unspecified}</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="reports-doc-footer">
        <p>
          وثيقة صادرة عن المنصة الرقمية للتصوير الجوي — {APP_CONFIG.orgName}
        </p>
        <p className="reports-doc-powered">{APP_CONFIG.poweredBy}</p>
      </footer>
    </article>
  )
}
