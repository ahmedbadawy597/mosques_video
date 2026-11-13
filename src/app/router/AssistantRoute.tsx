import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingState } from '@/components/common/LoadingState'

interface AssistantRouteProps {
  children: ReactNode
}

/** Protects إدارة المساجد — assistant session required. */
export function AssistantRoute({ children }: AssistantRouteProps) {
  const { loading, isAssistant } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingState message="جاري التحقق من صلاحية الإدارة..." />
  }

  if (!isAssistant) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return children
}
