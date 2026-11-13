import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, useRoutes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/common/LoadingState'
import { AssistantRoute } from './AssistantRoute'

const HomePage = lazy(() =>
  import('@/pages/HomePage').then((m) => ({ default: m.HomePage })),
)
const ManageMosquesPage = lazy(() =>
  import('@/pages/ManageMosquesPage').then((m) => ({
    default: m.ManageMosquesPage,
  })),
)
const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)

function SuspensePage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState message="جاري تجهيز الصفحة..." />}>
      {children}
    </Suspense>
  )
}

export function AppRouter() {
  return useRoutes([
    {
      path: '/login',
      element: (
        <SuspensePage>
          <LoginPage />
        </SuspensePage>
      ),
    },
    {
      path: '/',
      element: <AppShell />,
      children: [
        {
          index: true,
          element: (
            <SuspensePage>
              <HomePage />
            </SuspensePage>
          ),
        },
        {
          path: 'add',
          element: <Navigate to="/manage" replace />,
        },
        {
          path: 'manage',
          element: (
            <AssistantRoute>
              <SuspensePage>
                <ManageMosquesPage />
              </SuspensePage>
            </AssistantRoute>
          ),
        },
        {
          path: 'reports',
          element: (
            <SuspensePage>
              <ReportsPage />
            </SuspensePage>
          ),
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ])
}
