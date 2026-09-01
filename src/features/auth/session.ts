import { clearAccessToken, getAccessToken, setAccessToken } from '../../lib/authToken'
import type { UserProfile } from './types'

/**
 * 로그인 세션(access token + 내 정보) 보관소.
 *
 * 토큰 자체는 공용 모듈 lib/authToken이 관리하고(axios 인터셉터가 같은 값을 사용한다),
 * 여기서는 화면 표시에 필요한 회원 정보를 함께 묶어 다룬다.
 * 백엔드는 refresh token 없이 access token만 발급하므로, 로그아웃은 보관 중인 토큰을 지우는 것으로 끝난다.
 */
const userKey = 'msds.auth.user'
const changeEvent = 'msds-auth-session'

export type Session = { accessToken: string; user: UserProfile | null }

export { getAccessToken }

export function getSession(): Session | null {
  const accessToken = getAccessToken()
  if (!accessToken) return null
  const raw = localStorage.getItem(userKey)
  if (!raw) return { accessToken, user: null }
  try {
    return { accessToken, user: JSON.parse(raw) as UserProfile }
  } catch {
    return { accessToken, user: null }
  }
}

export function setSession(accessToken: string, user: UserProfile | null) {
  setAccessToken(accessToken)
  if (user) localStorage.setItem(userKey, JSON.stringify(user))
  else localStorage.removeItem(userKey)
  window.dispatchEvent(new Event(changeEvent))
}

export function clearSession() {
  clearAccessToken()
  localStorage.removeItem(userKey)
  window.dispatchEvent(new Event(changeEvent))
}

/**
 * 세션 변경 구독. 해제 함수를 돌려준다.
 * 자체 이벤트 외에 authToken의 'msds-auth-changed'와 토큰이 만료되어 401이 난
 * 'msds-auth-expired'(apiClient 인터셉터)도 함께 듣는다.
 */
export function subscribeSession(listener: () => void) {
  const events = [changeEvent, 'msds-auth-changed', 'msds-auth-expired', 'storage']
  events.forEach((event) => addEventListener(event, listener))
  return () => events.forEach((event) => removeEventListener(event, listener))
}

// 로그인 후 되돌아갈 경로. 401 처리 화면들이 sessionStorage에 남겨 둔 값을 사용한다.
const returnPathKey = 'return_path'

export function setReturnPath(path: string) {
  sessionStorage.setItem(returnPathKey, path)
}

export function takeReturnPath(fallback = '/') {
  const path = sessionStorage.getItem(returnPathKey)
  sessionStorage.removeItem(returnPathKey)
  return path && path.startsWith('/') ? path : fallback
}
