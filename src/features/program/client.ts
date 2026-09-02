// src/api/client.ts

import { getAccessToken } from '../auth/session'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
}

async function readErrorMessage(response: Response) {
  const raw = await response.text()
  try {
    const body = JSON.parse(raw) as { message?: string }
    return body.message || raw
  } catch {
    return raw
  }
}

// POST 응답의 Location 헤더까지 필요할 때 쓰는 버전
async function requestWithLocation(
  path: string,
  options: RequestOptions = {},
): Promise<string | null> {
  const token = getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    // 로그인 붙이면 credentials: "include" 또는 Authorization 헤더 추가
  })
  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessage(res))
  }
  return res.headers.get('Location')
}

// 응답 바디(JSON)가 필요할 때 쓰는 버전
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessage(res))
  }
  if (res.status === 204) return undefined as T // No Content
  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  postForLocation: (path: string, body: unknown) =>
    requestWithLocation(path, { method: 'POST', body }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}
