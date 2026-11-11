import type { VideoStats } from '../types'
import './stats-cards.css'

const CARDS = [
  {
    key: 'videos',
    label: 'إجمالي الفيديوهات',
    icon: 'fa-video',
    tone: 'mint',
    getValue: (s: VideoStats) => String(s.totalVideos),
  },
  {
    key: 'govs',
    label: 'المحافظات المغطاة',
    icon: 'fa-map-location-dot',
    tone: 'mint',
    getValue: (s: VideoStats) => String(s.uniqueGovernorates),
  },
  {
    key: 'mosques',
    label: 'المساجد الموثقة',
    icon: 'fa-mosque',
    tone: 'gold',
    getValue: (s: VideoStats) => String(s.uniqueMosques),
  },
] as const

export function StatsCards({ stats }: { stats: VideoStats }) {
  return (
    <div className="stats-grid">
      {CARDS.map((card) => (
        <article key={card.key} className={`stats-card surface-card tone-${card.tone}`}>
          <div className="stats-copy">
            <p className="stats-label">{card.label}</p>
            <strong className="stats-value">{card.getValue(stats)}</strong>
          </div>
          <div className={`stats-icon ${card.tone}`} aria-hidden>
            <i className={`fa-solid ${card.icon}`} />
          </div>
        </article>
      ))}

      <article className="stats-card surface-card stats-status" aria-live="polite">
        <div className="stats-copy">
          <p className="stats-label">حالة النظام</p>
          <strong className="status-ok">
            <span className="status-dot" aria-hidden />
            متصل وجاهز
          </strong>
          <span className="status-meta">المنصة تعمل بشكل طبيعي</span>
        </div>
        <div className="stats-icon status" aria-hidden>
          <i className="fa-solid fa-signal" />
        </div>
      </article>
    </div>
  )
}
