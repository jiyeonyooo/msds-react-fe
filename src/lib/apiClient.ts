import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, getAccessToken } from '../features/auth/session'

const API_BASE_URL = (import.meta.env.API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const commonConfig = {
  baseURL: `${API_BASE_URL}/api`,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
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
