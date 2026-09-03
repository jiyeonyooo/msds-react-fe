import axios from 'axios'
import { authApiClient, publicApiClient } from '../../lib/apiClient'
import type { RoomSummary } from '../rooms/types'
import type {
  ApiEnvelope,
  FacilityCreateRequest,
  FacilityDetail,
  FacilityUpdateRequest,
  RoomCreateRequest,
  RoomDetail,
  RoomImageCreateRequest,
  RoomUpdateRequest,
  UploadedImage,
} from './types'

export class AdminApiError extends Error {
  status: number
  code: string

  constructor(status: number, message: string, code = 'UNKNOWN_ERROR') {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request<T>(action: () => Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const response = await action()
    if (!response.data || !('data' in response.data))
      throw new AdminApiError(0, '서버 응답을 확인할 수 없습니다.', 'INVALID_RESPONSE')
    return response.data.data
  } catch (error) {
    if (error instanceof AdminApiError) throw error
    if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
      throw new AdminApiError(
        error.response?.status ?? 0,
        error.response?.data?.message || '요청을 처리하지 못했습니다.',
        error.response?.data?.code || 'NETWORK_ERROR',
      )
    }
    throw new AdminApiError(0, '요청을 처리하지 못했습니다.')
  }
}

export const adminApi = {
  roomList: () => request(() => publicApiClient.get<ApiEnvelope<RoomSummary[]>>('/rooms')),
  roomDetail: (id: number) =>
    request(() => publicApiClient.get<ApiEnvelope<RoomDetail>>(`/rooms/${id}`)),
  createRoom: (body: RoomCreateRequest) =>
    request(() => authApiClient.post<ApiEnvelope<RoomDetail>>('/admin/rooms', body)),
  updateRoom: (id: number, body: RoomUpdateRequest) =>
    request(() => authApiClient.patch<ApiEnvelope<RoomDetail>>(`/admin/rooms/${id}`, body)),
  uploadImage: (
    file: File,
    category: 'rooms' | 'facilities',
    onProgress?: (percent: number) => void,
  ) => {
    const formData = new FormData()
    formData.append('image', file)
    return request(() =>
      authApiClient.post<ApiEnvelope<UploadedImage>>(`/admin/images/${category}`, formData, {
        headers: { 'Content-Type': undefined },
        onUploadProgress: (event) => {
          if (event.total && onProgress)
            onProgress(Math.round((event.loaded * 100) / event.total))
        },
      }),
    )
  },
  addRoomImages: (id: number, body: RoomImageCreateRequest[]) =>
    request(() =>
      authApiClient.post<ApiEnvelope<unknown>>(`/admin/rooms/${id}/images`, body),
    ),
  deleteRoomImage: (roomId: number, imageId: number) =>
    request(() =>
      authApiClient.delete<ApiEnvelope<unknown>>(`/admin/rooms/${roomId}/images/${imageId}`),
    ),
  facilityList: () =>
    request(() => authApiClient.get<ApiEnvelope<FacilityDetail[]>>('/admin/facilities')),
  facilityDetail: (id: number) =>
    request(() => authApiClient.get<ApiEnvelope<FacilityDetail>>(`/admin/facilities/${id}`)),
  createFacility: (body: FacilityCreateRequest) =>
    request(() => authApiClient.post<ApiEnvelope<FacilityDetail>>('/admin/facilities', body)),
  updateFacility: (id: number, body: FacilityUpdateRequest) =>
    request(() =>
      authApiClient.patch<ApiEnvelope<FacilityDetail>>(`/admin/facilities/${id}`, body),
    ),
}
