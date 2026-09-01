import type { UserProfile } from './types'

/**
 * 로그인 세션(access token + 내 정보) 보관소.
 *
 * 백엔드는 refresh token 없이 access token만 발급하므로 클라이언트는
 * 토큰을 localStorage에 보관하고 요청마다 Authorization 헤더로 실어 보낸다.
 * 로그아웃은 보관 중인 토큰을 지우는 것으로 완료된다.
 */
const tokenKey = 'msds.auth.token'
const userKey = 'msds.auth.user'
const changeEvent = 'msds-auth-session'

export type Session = { accessToken: string; user: UserProfile | null }

export function getAccessToken(): string | null {
  return localStorage.getItem(tokenKey)
}

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
  localStorage.setItem(tokenKey, accessToken)
  if (user) localStorage.setItem(userKey, JSON.stringify(user))
  else localStorage.removeItem(userKey)
  window.dispatchEvent(new Event(changeEvent))
}

export function clearSession() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
  window.dispatchEvent(new Event(changeEvent))
}

// 세션 변경(로그인/로그아웃, 다른 탭에서의 변경) 구독. 해제 함수를 돌려준다.
export function subscribeSession(listener: () => void) {
  addEventListener(changeEvent, listener)
  addEventListener('storage', listener)
  return () => {
    removeEventListener(changeEvent, listener)
    removeEventListener('storage', listener)
  }
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
