import axios, { type AxiosInstance } from 'axios'
import { ApiRequestError } from './errors'
import type { ApiEnvelope, ApiErrorData } from './types'

export async function apiRequest<T>(
  client: AxiosInstance,
  config: Parameters<AxiosInstance['request']>[0],
): Promise<T> {
  try {
    const response = await client.request<ApiEnvelope<T>>(config)
    const body = response.data
    if (!body || typeof body !== 'object' || !('code' in body))
      throw new ApiRequestError(
        response.status,
        'API_INVALID_RESPONSE',
        'API 서버 응답을 확인할 수 없습니다.',
      )
    if (body.code !== 'OK') throw new ApiRequestError(response.status, body.code, body.message)
    return body.data
  } catch (error) {
    if (error instanceof ApiRequestError) throw error
    if (axios.isAxiosError<ApiEnvelope<ApiErrorData>>(error)) {
      const body = error.response?.data
      if (error.response && body && typeof body === 'object' && 'code' in body)
        throw new ApiRequestError(
          error.response.status,
          body.code,
          body.message,
          body.data?.errors ?? [],
        )
    }
    throw new ApiRequestError(0, 'API_NETWORK_ERROR', 'API 서버에 연결할 수 없습니다.')
  }
}
