import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, getAccessToken } from '../features/auth/session'

// 개발 환경은 빈 값으로 두어 Vite의 /api 프록시를 사용한다.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const commonConfig = {
  baseURL: `${API_BASE_URL}/api`,
  // Axios가 일반 객체에는 application/json을, FormData에는 boundary가 포함된
  // multipart/form-data를 요청 데이터에 맞춰 자동으로 설정합니다.
  headers: { Accept: 'application/json' },
}

/** 인증이 필요 없는 API 전용 클라이언트입니다. */
export const publicApiClient = axios.create(commonConfig)

/** JWT 인증이 필요한 API 전용 클라이언트입니다. */
export const authApiClient = axios.create({ ...commonConfig, withCredentials: true })

function attachAccessToken(config: InternalAxiosRequestConfig) {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}

function handleAuthError(error: AxiosError) {
  if (error.response?.status === 401) {
    clearSession()
    window.dispatchEvent(new CustomEvent('msds-auth-expired', { detail: { status: 401 } }))
  }
  return Promise.reject(error)
}

authApiClient.interceptors.request.use(attachAccessToken)
authApiClient.interceptors.response.use((response) => response, handleAuthError)
