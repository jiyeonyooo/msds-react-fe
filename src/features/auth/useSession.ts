import { useEffect, useState } from 'react'
import { getSession, subscribeSession, type Session } from './session'

// 로그인 세션을 구독하는 훅. 다른 탭/다른 화면에서의 로그인·로그아웃도 함께 반영된다.
export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(() => getSession())
  useEffect(() => subscribeSession(() => setSession(getSession())), [])
  return session
}
