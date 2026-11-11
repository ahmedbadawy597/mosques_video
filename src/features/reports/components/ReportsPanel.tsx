import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/common/Modal'
import { GOVERNORATES } from '@/constants/governorates'
import { APP_CONFIG } from '@/config/app'
import { useVideos } from '@/app/providers/VideosProvider'
import { useVideoFilters } from '@/features/videos/hooks/useVideoFilters'
import { downloadCsv, videosToCsv } from '@/features/videos/utils/csv'
import { isSpecified } from '@/utils/isSpecified'
import { toSafeHref } from '@/utils/safeUrl'
import '../styles/reports.css'

export function ReportsPanel() {
  const { videos, deleteVideo } = useVideos()
  const [search, setSearch] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [date, setDate] = useState('')
  const [modal, setModal] = useState<{ title: string; message: string } | null>(null)

  const filters = useMemo(
    () => ({ search, governorate, date }),
    [search, governorate, date],
  )
  const filtered = useVideoFilters(videos, filters)

  const onExport = () => {
    downloadCsv('mosques_aerial_videos_report.csv', videosToCsv(filtered))
  }

  const onDelete = (id: string) => {
    deleteVideo(id)
    setModal({ title: 'تم الحذف', message: 'تم إزالة السجل من النظام بنجاح.' })
  }

  return (
    <div className="reports-page">
      <section className="surface-card reports-toolbar no-print">
        <div className="reports-toolbar-head">
          <h3>
            <i className="fa-solid fa-filter" aria-hidden />
            فلترة واستعلامات متقدمة
          </h3>
          <div className="reports-actions">
            <Button variant="soft" onClick={() => window.print()}>
              <i className="fa-solid fa-print" aria-hidden />
              طباعة التقرير
            </Button>
            <Button onClick={onExport}>
              <i className="fa-solid fa-file-excel" aria-hidden />
              تصدير البيانات
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
              placeholder="ابحث باسم المسجد..."
            />
          </div>
          <div className="field">
            <label htmlFor="report-gov">فلتر حسب المحافظة</label>
            <select
              id="report-gov"
              className="select"
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
            >
              <option value="">جميع المحافظات (27)</option>
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
        </div>
      </section>

      <div className="print-only" style={{ textAlign: 'center', marginBottom: 24 }}>
        <img
          src={APP_CONFIG.logoUrl}
          alt="شعار وزارة الأوقاف"
          width={64}
          height={64}
          style={{ margin: '0 auto 8px', objectFit: 'contain' }}
        />
        <p style={{ fontWeight: 700 }}>{APP_CONFIG.orgName}</p>
        <h1>{APP_CONFIG.title}</h1>
        <p>تقرير فيديوهات المساجد وملحقاتها بجمهورية مصر العربية</p>
        <hr />
      </div>

      <section className="surface-card reports-table-wrap">
        <div className="reports-table-head">
          <h4>نتائج الاستعلامات وسجل الفيديوهات</h4>
          <span className="badge">{filtered.length} نتيجة</span>
        </div>

        <div className="table-scroll">
          <table className="reports-table">
            <thead>
              <tr>
                <th>#</th>
                <th>اسم المسجد وملحقاته</th>
                <th>المحافظة</th>
                <th>تاريخ التصوير</th>
                <th>رابط الموقع (Google Maps)</th>
                <th>خريطة القصة (StoryMap)</th>
                <th className="no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    لا توجد بيانات مطابقة لخيارات الاستعلام
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => {
                  const mapHref = isSpecified(item.mapUrl) ? toSafeHref(item.mapUrl) : null
                  const storyHref = isSpecified(item.storyUrl)
                    ? toSafeHref(item.storyUrl)
                    : null

                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td className="strong">{item.name}</td>
                      <td>
                        <span className="badge">{item.governorate}</span>
                      </td>
                      <td>{item.date}</td>
                      <td>
                        {mapHref ? (
                          <a href={mapHref} target="_blank" rel="noopener noreferrer">
                            <i className="fa-solid fa-map-location-dot" aria-hidden /> رابط الموقع
                          </a>
                        ) : (
                          <span className="muted">{APP_CONFIG.unspecified}</span>
                        )}
                      </td>
                      <td>
                        {storyHref ? (
                          <a href={storyHref} target="_blank" rel="noopener noreferrer">
                            <i className="fa-solid fa-book-open" aria-hidden /> فتح القصة
                          </a>
                        ) : (
                          <span className="muted">{APP_CONFIG.unspecified}</span>
                        )}
                      </td>
                      <td className="no-print">
                        <Button
                          variant="danger"
                          aria-label={`حذف ${item.name}`}
                          onClick={() => onDelete(item.id)}
                        >
                          <i className="fa-solid fa-trash-can" aria-hidden />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={Boolean(modal)}
        title={modal?.title ?? ''}
        message={modal?.message ?? ''}
        onClose={() => setModal(null)}
      />
    </div>
  )
}
