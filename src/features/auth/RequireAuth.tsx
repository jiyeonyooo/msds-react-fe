import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { setReturnPath } from './session'
import { useSession } from './useSession'

// 로그인이 필요한 화면을 감싸는 가드. 비로그인 상태면 원래 경로를 남기고 로그인 화면으로 보낸다.
export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession()
  const location = useLocation()
  if (!session) {
    setReturnPath(location.pathname + location.search)
    return <Navigate replace to="/login" />
  }
  return <>{children}</>
}
