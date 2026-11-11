import type { ReactNode } from 'react'

export function EmptyState({
  icon = 'fa-film',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="surface-card" style={{ padding: 48, textAlign: 'center' }}>
      <i className={`fa-solid ${icon}`} style={{ fontSize: 36, color: 'var(--mute)', marginBottom: 12 }} aria-hidden />
      <p style={{ margin: 0, fontWeight: 700 }}>{title}</p>
      {description ? (
        <p style={{ margin: '8px 0 0', color: 'var(--mute)', fontSize: 14 }}>{description}</p>
      ) : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  )
}
