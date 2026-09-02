import { setDevAuthState } from '../../dev/auth'
import { isDevMode } from '../../dev/scenarios'
import { authApiClient, publicApiClient } from '../../lib/apiClient'
import { call } from '../../lib/apiError'
import { clearSession, setSession } from './session'
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  UserProfile,
} from './types'

export const authApi = {
  // 회원가입: 201 CREATED + { email }
  signup: (data: SignupRequest) =>
    call<SignupResponse>(() => publicApiClient.post('/auth/signup', data)),

  // 로그인: 200 OK + { accessToken }
  login: (data: LoginRequest) =>
    call<LoginResponse>(() => publicApiClient.post('/auth/login', data)),

  // 내 정보 조회(발급받은 토큰이 실제로 통하는지 확인하는 용도로도 사용)
  me: () => call<UserProfile>(() => authApiClient.get('/users/me')),

  logout: () => call<null>(() => authApiClient.post('/auth/logout')),
}

/**
 * 로그인 한 번의 전체 흐름.
 * 토큰을 받아 보관한 뒤 그 토큰으로 내 정보를 조회해, 실제로 인증된 상태인지까지 확인한다.
 * 내 정보 조회가 실패해도 로그인 자체는 성공이므로 세션은 유지한다.
 */
export async function signIn(data: LoginRequest): Promise<UserProfile | null> {
  const login = await authApi.login(data)
  setSession(login.data.accessToken, null)
  let profile: UserProfile | null
  try {
    profile = (await authApi.me()).data
  } catch {
    profile = null
  }
  setSession(login.data.accessToken, profile)
  // DEV 도구의 인증 상태도 함께 맞춰, 기존 예약 화면의 목 응답이 어긋나지 않게 한다.
  if (isDevMode) setDevAuthState('member')
  return profile
}

// 로그아웃: 서버에 알린 뒤(실패해도 무방) 클라이언트 세션을 비운다.
export async function signOut() {
  try {
    await authApi.logout()
  } catch {
    // 서버가 저장하는 상태가 없으므로 실패해도 클라이언트 정리만으로 로그아웃이 끝난다.
  }
  clearSession()
  if (isDevMode) setDevAuthState('guest')
}