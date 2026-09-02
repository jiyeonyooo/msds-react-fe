import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getDevAuthState } from '../../dev/auth'
import { isDevMode } from '../../dev/scenarios'
import { setReturnPath } from '../auth/session'
import { useSession } from '../auth/useSession'

/** 관리자 전용 경로의 역할 가드. 역할을 확인할 수 없는 세션도 보호한다. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const session = useSession()
  const location = useLocation()

  const isDevAdmin = isDevMode && getDevAuthState() === 'admin'
  if (!session && !isDevAdmin) {
    setReturnPath(location.pathname + location.search)
    return <Navigate replace to="/login" />
  }
  if (!isDevAdmin && session?.user?.role !== 'ADMIN') return <Navigate replace to="/admin/forbidden" />

  return <>{children}</>
}
