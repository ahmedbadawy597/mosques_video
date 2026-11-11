import { useEffect } from 'react'
import { APP_CONFIG } from '@/config/app'
import { Button } from '@/components/ui/Button'

interface ModalProps {
  open: boolean
  title: string
  message: string
  onClose: () => void
}

export function Modal({ open, title, message, onClose }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 50,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <div
        className="surface-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(420px, 100%)', padding: 24, textAlign: 'center' }}
      >
        <img
          src={APP_CONFIG.logoUrl}
          alt=""
          width={56}
          height={56}
          style={{ margin: '0 auto 12px', objectFit: 'contain' }}
        />
        <h3 id="app-modal-title" style={{ margin: '0 0 8px', color: 'var(--primary)' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 20px', color: 'var(--mute)', fontSize: 14 }}>{message}</p>
        <Button onClick={onClose} style={{ width: '100%' }}>
          موافق
        </Button>
      </div>
    </div>
  )
}
