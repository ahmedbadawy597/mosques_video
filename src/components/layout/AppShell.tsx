import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import './sidebar.css'
import './topbar.css'

const TITLES: Record<string, string> = {
  '/': 'لوحة المؤشرات والبطاقات الرئيسية',
  '/manage': 'إدارة المساجد',
  '/reports': 'الاستعلامات والتقارير المساحية',
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const title = useMemo(
    () => TITLES[location.pathname] ?? APP_FALLBACK_TITLE,
    [location.pathname],
  )

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('is-drawer-open', sidebarOpen)
    return () => document.body.classList.remove('is-drawer-open')
  }, [sidebarOpen])

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <TopBar title={title} onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="main-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

const APP_FALLBACK_TITLE = 'المنصة الرقمية للتصوير الجوى والرفع المساحى'
