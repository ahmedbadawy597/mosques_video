import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/common/Modal'
import { EmptyState } from '@/components/common/EmptyState'
import { GOVERNORATES } from '@/constants/governorates'
import { APP_CONFIG } from '@/config/app'
import { useVideos } from '@/app/providers/VideosProvider'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { VideoRecord } from '../types'
import { isSpecified } from '@/utils/isSpecified'
import { toSafeHref } from '@/utils/safeUrl'
import { AddVideoForm } from './AddVideoForm'
import './manage-mosques.css'

function toDateInputValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return ''
}

export function ManageMosquesPanel() {
  const { videos, updateVideo, deleteVideo } = useVideos()
  const [search, setSearch] = useState('')
  const [governorate, setGovernorate] = useState('')
  const debouncedSearch = useDebouncedValue(search, 200)

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<VideoRecord | null>(null)
  const [pendingDelete, setPendingDelete] = useState<VideoRecord | null>(null)
  const [toast, setToast] = useState<{ title: string; message: string } | null>(
    null,
  )

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return videos.filter((v) => {
      if (governorate && v.governorate !== governorate) return false
      if (!q) return true
      return (
        v.name.toLowerCase().includes(q) ||
        v.governorate.toLowerCase().includes(q) ||
        v.storyId.toLowerCase().includes(q)
      )
    })
  }, [videos, debouncedSearch, governorate])

  const onSaveEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editing) return

    const name = editing.name.trim()
    const gov = editing.governorate.trim()
    const mapUrl = editing.mapUrl.trim()
    const videoUrl = editing.videoUrl.trim()

    if (!name || !gov || !mapUrl || !videoUrl) {
      setToast({
        title: 'بيانات ناقصة',
        message: 'الاسم والمحافظة ورابط الخريطة ورابط الفيديو مطلوبة.',
      })
      return
    }

    updateVideo({
      ...editing,
      name,
      governorate: gov,
      date: editing.date.trim() || APP_CONFIG.unspecified,
      mapUrl,
      videoUrl,
      storyUrl: editing.storyUrl.trim() || APP_CONFIG.unspecified,
    })
    setEditing(null)
    setToast({
      title: 'تم التحديث',
      message: 'تم حفظ تعديلات المسجد في المنصة.',
    })
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteVideo(pendingDelete.id)
    setPendingDelete(null)
    setToast({
      title: 'تم الحذف',
      message: `تم حذف «${pendingDelete.name}» من قائمة المساجد.`,
    })
  }

  return (
    <div className="manage-page">
      <section className="surface-card manage-toolbar">
        <div className="manage-toolbar-head">
          <div>
            <h3>
              <i className="fa-solid fa-mosque" aria-hidden />
              إدارة المساجد
            </h3>
            <p>اضافة مسجد من StoryMap، وتعديل أو حذف المساجد المحفوظة.</p>
          </div>
          <Button
            type="button"
            variant={showAdd ? 'muted' : 'primary'}
            onClick={() => setShowAdd((open) => !open)}
            aria-expanded={showAdd}
          >
            <i
              className={`fa-solid ${showAdd ? 'fa-xmark' : 'fa-circle-plus'}`}
              aria-hidden
            />
            {showAdd ? 'إخفاء نموذج الاضافة' : 'اضافة مسجد جديد'}
          </Button>
        </div>

        {showAdd ? (
          <div className="manage-add-slot" id="manage-add">
            <AddVideoForm
              embedded
              onCancel={() => setShowAdd(false)}
              onSaved={() => setShowAdd(false)}
            />
          </div>
        ) : null}

        <div className="manage-filters">
          <div className="field">
            <label htmlFor="manage-search">بحث</label>
            <input
              id="manage-search"
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="اسم المسجد أو المحافظة..."
            />
          </div>
          <div className="field">
            <label htmlFor="manage-gov">المحافظة</label>
            <select
              id="manage-gov"
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
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          title="لا توجد مساجد"
          description={
            videos.length === 0
              ? 'لم يُحفظ أي مسجد بعد. اضغط «اضافة مسجد جديد» أعلاه.'
              : 'لا نتائج مطابقة للبحث الحالي.'
          }
          action={
            videos.length === 0 ? (
              <Button type="button" onClick={() => setShowAdd(true)}>
                <i className="fa-solid fa-circle-plus" aria-hidden />
                اضافة مسجد جديد
              </Button>
            ) : undefined
          }
        />
      ) : (
        <section className="surface-card manage-table-wrap">
          <div className="manage-table-head">
            <h4>قائمة المساجد</h4>
            <span className="badge">{filtered.length} مسجد</span>
          </div>

          <div className="manage-table-scroll">
            <table className="manage-table">
              <thead>
                <tr>
                  <th>اسم المسجد</th>
                  <th>المحافظة</th>
                  <th>التاريخ</th>
                  <th>المصدر</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((video) => {
                  const mapHref = toSafeHref(video.mapUrl)
                  return (
                    <tr key={video.id}>
                      <td>
                        <strong className="manage-name">{video.name}</strong>
                        {isSpecified(video.storyUrl) && (
                          <a
                            className="manage-sublink"
                            href={toSafeHref(video.storyUrl) ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                          >
                            StoryMap
                          </a>
                        )}
                      </td>
                      <td>{video.governorate}</td>
                      <td>{video.date}</td>
                      <td>
                        <span
                          className={`manage-source ${video.isLocal ? 'is-local' : ''}`}
                        >
                          {video.isLocal ? 'محفوظ محلياً' : 'الكتالوج'}
                        </span>
                        {mapHref && (
                          <a
                            className="manage-sublink"
                            href={mapHref}
                            target="_blank"
                            rel="noreferrer"
                          >
                            الخريطة
                          </a>
                        )}
                      </td>
                      <td>
                        <div className="manage-row-actions">
                          <Button
                            type="button"
                            variant="soft"
                            onClick={() => setEditing({ ...video })}
                          >
                            <i className="fa-solid fa-pen" aria-hidden />
                            تعديل
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => setPendingDelete(video)}
                          >
                            <i className="fa-solid fa-trash" aria-hidden />
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {editing && (
        <div
          className="manage-drawer-backdrop"
          role="presentation"
          onClick={() => setEditing(null)}
        >
          <form
            className="surface-card manage-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-mosque-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSaveEdit}
          >
            <header className="manage-drawer-head">
              <h3 id="edit-mosque-title">
                <i className="fa-solid fa-pen-to-square" aria-hidden />
                تعديل بيانات المسجد
              </h3>
              <button
                type="button"
                className="manage-drawer-close"
                aria-label="إغلاق"
                onClick={() => setEditing(null)}
              >
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
            </header>

            <div className="manage-edit-grid">
              <div className="field">
                <label htmlFor="edit-name">
                  اسم المسجد <span className="req">*</span>
                </label>
                <input
                  id="edit-name"
                  required
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="edit-gov">
                  المحافظة <span className="req">*</span>
                </label>
                <select
                  id="edit-gov"
                  required
                  value={editing.governorate}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, governorate: e.target.value } : prev,
                    )
                  }
                >
                  <option value={APP_CONFIG.unspecified}>غير محدد</option>
                  {GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                  {editing.governorate &&
                    editing.governorate !== APP_CONFIG.unspecified &&
                    !GOVERNORATES.includes(
                      editing.governorate as (typeof GOVERNORATES)[number],
                    ) && (
                      <option value={editing.governorate}>
                        {editing.governorate}
                      </option>
                    )}
                </select>
              </div>

              <div className="field">
                <label htmlFor="edit-date">تاريخ التصوير</label>
                <input
                  id="edit-date"
                  type="date"
                  value={toDateInputValue(editing.date)}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            date: e.target.value || APP_CONFIG.unspecified,
                          }
                        : prev,
                    )
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="edit-map">
                  رابط الخريطة <span className="req">*</span>
                </label>
                <input
                  id="edit-map"
                  type="url"
                  required
                  value={
                    editing.mapUrl === APP_CONFIG.unspecified
                      ? ''
                      : editing.mapUrl
                  }
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            mapUrl: e.target.value || APP_CONFIG.unspecified,
                          }
                        : prev,
                    )
                  }
                />
              </div>

              <div className="field field-span">
                <label htmlFor="edit-video">
                  رابط الفيديو <span className="req">*</span>
                </label>
                <input
                  id="edit-video"
                  type="url"
                  required
                  value={editing.videoUrl}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, videoUrl: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div className="field field-span">
                <label htmlFor="edit-story">رابط StoryMap</label>
                <input
                  id="edit-story"
                  type="url"
                  value={
                    editing.storyUrl === APP_CONFIG.unspecified
                      ? ''
                      : editing.storyUrl
                  }
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            storyUrl: e.target.value || APP_CONFIG.unspecified,
                          }
                        : prev,
                    )
                  }
                />
              </div>
            </div>

            <div className="manage-drawer-actions">
              <Button type="button" variant="muted" onClick={() => setEditing(null)}>
                إلغاء
              </Button>
              <Button type="submit">
                <i className="fa-solid fa-floppy-disk" aria-hidden />
                حفظ التعديلات
              </Button>
            </div>
          </form>
        </div>
      )}

      {pendingDelete && (
        <div
          className="manage-drawer-backdrop"
          role="presentation"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="surface-card manage-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-mosque-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-mosque-title">تأكيد الحذف</h3>
            <p>
              هل تريد حذف المسجد «{pendingDelete.name}»؟ لن يظهر في الرئيسية أو
              التقارير بعد الحذف.
            </p>
            <div className="manage-drawer-actions">
              <Button
                type="button"
                variant="muted"
                onClick={() => setPendingDelete(null)}
              >
                إلغاء
              </Button>
              <Button type="button" variant="danger" onClick={confirmDelete}>
                <i className="fa-solid fa-trash" aria-hidden />
                حذف نهائي
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(toast)}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        onClose={() => setToast(null)}
      />
    </div>
  )
}
