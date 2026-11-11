import { NavLink } from 'react-router-dom'
import { APP_CONFIG } from '@/config/app'
import { useTheme } from '@/app/providers/ThemeProvider'
import './sidebar.css'

const NAV = [
  { to: '/', label: 'الرئيسية والمؤشرات', icon: 'fa-chart-pie', end: true },
  { to: '/manage', label: 'إدارة المساجد', icon: 'fa-mosque', end: false },
  { to: '/reports', label: 'استعلامات وتقارير', icon: 'fa-file-lines', end: false },
] as const

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { isDark, setTheme } = useTheme()

  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="القائمة الجانبية">
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrap">
            <img
              src={APP_CONFIG.logoUrl}
              alt="شعار وزارة الأوقاف المصرية"
              width={54}
              height={54}
              className="sidebar-logo"
              decoding="async"
            />
          </div>
          <p className="sidebar-org">{APP_CONFIG.orgName}</p>
          <h1 className="sidebar-title">{APP_CONFIG.title}</h1>
          <p className="sidebar-chip">إدارة فيديوهات المساجد</p>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon" aria-hidden>
                <i className={`fa-solid ${item.icon}`} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="theme-control">
            <p className="theme-control-label">المظهر</p>
            <div
              className="theme-segment"
              role="group"
              aria-label="اختيار مظهر الواجهة"
            >
              <button
                type="button"
                className={`theme-segment-btn ${!isDark ? 'is-active' : ''}`}
                aria-pressed={!isDark}
                onClick={() => setTheme('light')}
              >
                <i className="fa-solid fa-sun" aria-hidden />
                نهاري
              </button>
              <button
                type="button"
                className={`theme-segment-btn ${isDark ? 'is-active' : ''}`}
                aria-pressed={isDark}
                onClick={() => setTheme('dark')}
              >
                <i className="fa-solid fa-moon" aria-hidden />
                ليلي
              </button>
            </div>
          </div>
          <p className="powered">{APP_CONFIG.poweredBy}</p>
        </div>
      </aside>
    </>
  )
}
