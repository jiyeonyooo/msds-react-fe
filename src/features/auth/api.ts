import { setDevAuthState } from '../../dev/auth'
import { isDevMode } from '../../dev/scenarios'
import { clearSession, getAccessToken, setSession } from './session'
import type {
  ApiEnvelope,
  FieldErrors,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  UserProfile,
} from './types'

// 개발 환경에서는 Vite dev 서버가 /api 요청을 Spring 서버로 프록시한다(vite.config.ts).
// 배포 환경에서 API 오리진이 다르면 VITE_API_BASE_URL로 덮어쓴다.
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export class AuthApiError extends Error {
  status: number
  code: string
  fieldErrors: FieldErrors
  constructor(status: number, code: string, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

/**
 * 400(INVALID_INPUT) 응답의 메시지를 필드별 에러로 되돌린다.
 * 서버는 "email: 올바른 이메일 형식이 아닙니다., password: 비밀번호는 필수 입력값입니다."처럼
 * "필드명: 메시지"를 쉼표로 이어 붙여 내려주므로, 필드명 위치를 기준으로 잘라낸다.
 */
const requestFields = ['email', 'password', 'name', 'phoneNumber'] as const

export function parseFieldErrors(message: string): FieldErrors {
  const marker = new RegExp(`(?:^|,\\s*)(${requestFields.join('|')}):\\s*`, 'g')
  const markers = [...message.matchAll(marker)]
  const errors: FieldErrors = {}
  markers.forEach((match, index) => {
    const start = match.index + match[0].length
    const end = index + 1 < markers.length ? markers[index + 1].index : message.length
    const text = message.slice(start, end).trim()
    if (text) errors[match[1]] = text
  })
  return errors
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const token = getAccessToken()
  let response: Response
  try {
    response = await fetch(`${baseUrl}/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new AuthApiError(
      0,
      'NETWORK_ERROR',
      'API 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.',
    )
  }

  const raw = await response.text()
  let body: ApiEnvelope<T> | null
  try {
    body = raw ? (JSON.parse(raw) as ApiEnvelope<T>) : null
  } catch {
    body = null
  }

  if (!body)
    throw new AuthApiError(
      response.status,
      'API_INVALID_RESPONSE',
      'API 서버 응답을 확인할 수 없습니다. 백엔드 연결 상태를 확인해 주세요.',
    )

  if (!response.ok)
    throw new AuthApiError(
      response.status,
      body.code,
      body.message,
      body.code === 'INVALID_INPUT' ? parseFieldErrors(body.message) : {},
    )

  return body
}

export const authApi = {
  // 회원가입: 201 CREATED + { email }
  signup: (data: SignupRequest) =>
    request<SignupResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  // 로그인: 200 OK + { accessToken }
  login: (data: LoginRequest) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // 내 정보 조회(발급받은 토큰이 실제로 통하는지 확인하는 용도로도 사용)
  me: () => request<UserProfile>('/users/me'),

  logout: () => request<null>('/auth/logout', { method: 'POST' }),
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
