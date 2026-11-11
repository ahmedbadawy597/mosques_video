import { APP_CONFIG } from '@/config/app'

interface TopBarProps {
  title: string
  onOpenSidebar: () => void
}

export function TopBar({ title, onOpenSidebar }: TopBarProps) {
  return (
    <header className="topbar surface-card" style={{ borderRadius: 0, boxShadow: 'none' }}>
      <div className="topbar-inner">
        <div className="topbar-start">
          <button
            type="button"
            className="menu-btn no-print"
            onClick={onOpenSidebar}
            aria-label="فتح القائمة"
          >
            <i className="fa-solid fa-bars" aria-hidden />
          </button>
          <div>
            <h2>{title}</h2>
            <p>متابعة أعمال التصوير الجوي والرفع المساحي للمساجد وملحقاتها</p>
          </div>
        </div>
        <div className="topbar-end">
          <div className="org-chip">
            <i className="fa-solid fa-landmark" aria-hidden />
            <span>{APP_CONFIG.orgName}</span>
          </div>
          <img
            src={APP_CONFIG.logoUrl}
            alt="شعار الوزارة"
            width={40}
            height={40}
            className="topbar-logo"
          />
        </div>
      </div>
    </header>
  )
}
