import axios from 'axios'
import { publicApiClient } from '../../lib/apiClient'
import type { RoomDetail, RoomSummary } from './types'

type ApiResponse<T> = { code: string; message: string; data: T }

export class RoomApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function get<T>(path: string): Promise<T> {
  try {
    const response = await publicApiClient.get<ApiResponse<T>>(path)
    if (!response.data || typeof response.data !== 'object' || !('data' in response.data)) {
      throw new RoomApiError(response.status, '서버 응답을 확인할 수 없습니다.')
    }
    return response.data.data
  } catch (error) {
    if (error instanceof RoomApiError) throw error
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      throw new RoomApiError(
        error.response?.status ?? 0,
        error.response?.data?.message || '객실 정보를 불러오지 못했습니다.',
      )
    }
    throw new RoomApiError(0, '객실 정보를 불러오지 못했습니다.')
  }
}

export const roomsApi = {
  list: () => get<RoomSummary[]>('/rooms'),
  detail: (roomId: number) => get<RoomDetail>(`/rooms/${roomId}`),
}
