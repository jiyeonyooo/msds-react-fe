import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getDevAuthState } from '../../dev/auth'
import { isDevMode } from '../../dev/scenarios'
import { setReturnPath } from '../auth/session'
import { useSession } from '../auth/useSession'

/** 관리자는 마이페이지 대신 관리자 센터로 안내한다. */
export function RequireMemberMyPage({ children }: { children: ReactNode }) {
  const session = useSession()
  const location = useLocation()

  const isDevSignedIn = isDevMode && getDevAuthState() !== 'guest'
  if (!session && !isDevSignedIn) {
    setReturnPath(location.pathname + location.search)
    return <Navigate replace to="/login" />
  }
  if (session?.user?.role === 'ADMIN' || (isDevMode && getDevAuthState() === 'admin')) return <Navigate replace to="/admin" />

  return <>{children}</>
}
