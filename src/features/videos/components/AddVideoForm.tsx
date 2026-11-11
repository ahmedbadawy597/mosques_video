import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/common/Modal'
import { GOVERNORATES } from '@/constants/governorates'
import { APP_CONFIG } from '@/config/app'
import { useVideos } from '@/app/providers/VideosProvider'
import {
  extractFromStoryMapUrl,
  parseStoryId,
} from '../services/storymapExtract'
import type { VideoRecord } from '../types'
import './add-form.css'

type Phase = 'idle' | 'loading' | 'ready' | 'error'

function toDateInputValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return ''
}

interface AddVideoFormProps {
  /** When true, form lives inside manage page (no route leave). */
  embedded?: boolean
  onSaved?: () => void
  onCancel?: () => void
}

export function AddVideoForm({
  embedded = false,
  onSaved,
  onCancel,
}: AddVideoFormProps) {
  const { addVideos, videos } = useVideos()
  const formId = useId()
  const abortRef = useRef<AbortController | null>(null)

  const [storyInput, setStoryInput] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [storyMeta, setStoryMeta] = useState<{
    title: string
    id: string
    url: string
  } | null>(null)
  const [draft, setDraft] = useState<VideoRecord | null>(null)
  const [modal, setModal] = useState<{ title: string; message: string } | null>(
    null,
  )

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const alreadySaved =
    draft != null && videos.some((v) => v.id === draft.id)

  const updateDraft = <K extends keyof VideoRecord>(
    key: K,
    value: VideoRecord[K],
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const onExtract = async () => {
    const trimmed = storyInput.trim()
    if (!trimmed) {
      setPhase('error')
      setErrorMsg('أدخل رابط خريطة القصة أولاً.')
      return
    }
    if (!parseStoryId(trimmed)) {
      setPhase('error')
      setErrorMsg(
        'رابط غير صالح. مثال: …/apps/storymaps/stories/bb05b26addb6450e81d6f28a27b2083b',
      )
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setPhase('loading')
    setErrorMsg(null)
    setWarnings([])
    setDraft(null)
    setStoryMeta(null)

    try {
      const result = await extractFromStoryMapUrl(trimmed, controller.signal)
      if (controller.signal.aborted) return

      if (result.videos.length === 0) {
        setPhase('error')
        setErrorMsg(
          'تم الوصول لخريطة القصة لكن لم يُعثر على فيديو قابل للاستيراد.',
        )
        setWarnings(result.warnings)
        return
      }

      const primary = result.videos[0]!
      setStoryMeta({
        title: result.storyTitle,
        id: result.storyId,
        url: result.storyUrl,
      })
      setDraft({ ...primary })
      setWarnings(result.warnings)
      setPhase('ready')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setPhase('error')
      setErrorMsg(
        err instanceof Error ? err.message : 'تعذر استخراج بيانات خريطة القصة',
      )
    }
  }

  const onReset = () => {
    abortRef.current?.abort()
    setStoryInput('')
    setPhase('idle')
    setErrorMsg(null)
    setWarnings([])
    setDraft(null)
    setStoryMeta(null)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) {
      setModal({
        title: 'استخراج مطلوب',
        message: 'الصق رابط StoryMap ثم اضغط «استخراج البيانات» قبل الحفظ.',
      })
      return
    }

    const name = draft.name.trim()
    const governorate = draft.governorate.trim()
    const mapUrl = draft.mapUrl.trim()
    const videoUrl = draft.videoUrl.trim()

    if (!name || !governorate || !mapUrl || !videoUrl) {
      setModal({
        title: 'بيانات ناقصة',
        message: 'أكمل الحقول الإلزامية قبل الحفظ (الاسم، المحافظة، الخريطة، الفيديو).',
      })
      return
    }

    if (mapUrl === APP_CONFIG.unspecified) {
      setModal({
        title: 'رابط الخريطة مطلوب',
        message: 'لم يُستخرج موقع على الخريطة تلقائياً — أدخل رابط Google Maps يدوياً.',
      })
      return
    }

    const record: VideoRecord = {
      ...draft,
      name,
      governorate,
      date: draft.date.trim() || APP_CONFIG.unspecified,
      mapUrl,
      videoUrl,
      storyUrl: draft.storyUrl.trim() || storyMeta?.url || APP_CONFIG.unspecified,
      isLocal: true,
    }

    const { added, skipped } = addVideos([record])
    if (added === 0 && skipped > 0) {
      setModal({
        title: 'موجود مسبقاً',
        message: 'هذا الفيديو محفوظ بالفعل في المنصة. لم يتم تكرار السجل.',
      })
      return
    }

    setModal({
      title: 'تم الحفظ بنجاح',
      message:
        'تم استيراد فيديو التصوير الجوي من خريطة القصة وحفظه في المنصة الرقمية.',
    })
    onReset()
  }

  return (
    <>
      <form
        className={`surface-card add-form${embedded ? ' add-form--embedded' : ''}`}
        onSubmit={onSubmit}
      >
        <header className="add-form-header">
          <h3>
            <i className="fa-solid fa-circle-plus" aria-hidden />
            اضافة مسجد جديد
          </h3>
          <p>
            الصق رابط ArcGIS StoryMap — تُملأ بيانات المسجد والفيديو تلقائياً، ثم
            راجعها واحفظ في المنصة.
          </p>
        </header>

        <section className="import-panel" aria-labelledby={`${formId}-import`}>
          <div className="import-panel-head">
            <h4 id={`${formId}-import`}>رابط خريطة القصة</h4>
            <span className="import-badge">استخراج تلقائي</span>
          </div>

          <div className="import-row">
            <div className="field import-field">
              <label htmlFor={`${formId}-story`}>
                رابط StoryMap أو معرّف العنصر <span className="req">*</span>
              </label>
              <input
                id={`${formId}-story`}
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://geoportal.strategizeit.us/arcgis/apps/storymaps/stories/…"
                value={storyInput}
                onChange={(e) => setStoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void onExtract()
                  }
                }}
              />
            </div>
            <Button
              type="button"
              onClick={() => void onExtract()}
              disabled={phase === 'loading'}
              className="import-extract-btn"
            >
              {phase === 'loading' ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden />
                  جاري الاستخراج…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles" aria-hidden />
                  استخراج البيانات
                </>
              )}
            </Button>
          </div>

          {phase === 'loading' && (
            <p className="import-status is-loading" role="status">
              الاتصال ببوابة ArcGIS وقراءة عقد الفيديو والخريطة…
            </p>
          )}
          {phase === 'error' && errorMsg && (
            <p className="import-status is-error" role="alert">
              {errorMsg}
            </p>
          )}
          {phase === 'ready' && storyMeta && (
            <div className="import-meta">
              <div>
                <span className="import-meta-label">العنوان</span>
                <strong>{storyMeta.title}</strong>
              </div>
              <div>
                <span className="import-meta-label">المعرّف</span>
                <code>{storyMeta.id}</code>
              </div>
              {alreadySaved && (
                <p className="import-status is-warn">
                  هذا السجل موجود مسبقاً في الكتالوج — الحفظ سيتجاهل التكرار.
                </p>
              )}
            </div>
          )}
          {warnings.length > 0 && phase !== 'loading' && (
            <ul className="import-warnings">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </section>

        <fieldset className="add-fieldset" disabled={!draft}>
          <legend>البيانات المستخرجة (قابلة للتعديل قبل الحفظ)</legend>

          <div className="add-grid">
            <div className="field">
              <label htmlFor={`${formId}-name`}>
                اسم المسجد وملحقاته <span className="req">*</span>
              </label>
              <input
                id={`${formId}-name`}
                required={Boolean(draft)}
                value={draft?.name ?? ''}
                onChange={(e) => updateDraft('name', e.target.value)}
                placeholder="يُملأ تلقائياً من عنوان StoryMap"
              />
            </div>

            <div className="field">
              <label htmlFor={`${formId}-gov`}>
                المحافظة <span className="req">*</span>
              </label>
              <select
                id={`${formId}-gov`}
                required={Boolean(draft)}
                value={draft?.governorate || ''}
                onChange={(e) => updateDraft('governorate', e.target.value)}
              >
                <option value="" disabled>
                  اختر المحافظة...
                </option>
                <option value={APP_CONFIG.unspecified}>غير محدد</option>
                {GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
                {draft?.governorate &&
                  draft.governorate !== APP_CONFIG.unspecified &&
                  !GOVERNORATES.includes(
                    draft.governorate as (typeof GOVERNORATES)[number],
                  ) && (
                    <option value={draft.governorate}>{draft.governorate}</option>
                  )}
              </select>
            </div>

            <div className="field">
              <label htmlFor={`${formId}-date`}>تاريخ التصوير الجوي</label>
              <input
                id={`${formId}-date`}
                type="date"
                value={toDateInputValue(draft?.date ?? '')}
                onChange={(e) =>
                  updateDraft(
                    'date',
                    e.target.value || APP_CONFIG.unspecified,
                  )
                }
              />
              {draft &&
                draft.date !== APP_CONFIG.unspecified &&
                !toDateInputValue(draft.date) && (
                  <span className="field-hint">المستخرج: {draft.date}</span>
                )}
            </div>

            <div className="field">
              <label htmlFor={`${formId}-map`}>
                رابط الموقع على الخريطة <span className="req">*</span>
              </label>
              <input
                id={`${formId}-map`}
                type="url"
                required={Boolean(draft)}
                value={
                  draft?.mapUrl === APP_CONFIG.unspecified
                    ? ''
                    : (draft?.mapUrl ?? '')
                }
                onChange={(e) =>
                  updateDraft(
                    'mapUrl',
                    e.target.value || APP_CONFIG.unspecified,
                  )
                }
                placeholder="يُستخرج من مركز webmap داخل StoryMap"
              />
            </div>

            <div className="field field-span">
              <label htmlFor={`${formId}-video`}>
                رابط ملف الفيديو الجوي <span className="req">*</span>
              </label>
              <input
                id={`${formId}-video`}
                type="url"
                required={Boolean(draft)}
                readOnly
                value={draft?.videoUrl ?? ''}
                placeholder="يُستخرج تلقائياً من موارد العنصر"
              />
              <span className="field-hint">
                يُحفظ كرابط مستضاف على بوابة ArcGIS (لا يُرفع ملف من الجهاز)
              </span>
            </div>

            <div className="field field-span">
              <label htmlFor={`${formId}-story-url`}>رابط خريطة القصة</label>
              <input
                id={`${formId}-story-url`}
                type="url"
                readOnly
                value={draft?.storyUrl ?? ''}
              />
            </div>
          </div>
        </fieldset>

        <div className="add-actions">
          <Button type="button" variant="muted" onClick={onReset}>
            مسح النموذج
          </Button>
          {onCancel ? (
            <Button type="button" variant="muted" onClick={onCancel}>
              إغلاق
            </Button>
          ) : null}
          <Button type="submit" disabled={!draft || phase === 'loading'}>
            <i className="fa-solid fa-floppy-disk" aria-hidden />
            حفظ في المنصة
          </Button>
        </div>
      </form>

      <Modal
        open={Boolean(modal)}
        title={modal?.title ?? ''}
        message={modal?.message ?? ''}
        onClose={() => {
          const wasSuccess = modal?.title === 'تم الحفظ بنجاح'
          setModal(null)
          if (wasSuccess) onSaved?.()
        }}
      />
    </>
  )
}
