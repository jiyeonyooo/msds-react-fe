import { authApiClient } from '../../../lib/apiClient'
import { call } from '../../../lib/apiError'
import type {
  AdminFacility,
  AdminFacilityRequest,
  AdminFacilityUpdateRequest,
  AdminRoom,
  AdminRoomRequest,
  AdminRoomUpdateRequest,
} from './types'

export const adminRoomsApi = {
  async list() {
    return (await call<AdminRoom[]>(() => authApiClient.get('/admin/rooms'))).data
  },
  async detail(roomId: number) {
    return (await call<AdminRoom>(() => authApiClient.get(`/admin/rooms/${roomId}`))).data
  },
  async create(request: AdminRoomRequest) {
    return (await call<AdminRoom>(() => authApiClient.post('/admin/rooms', request))).data
  },
  async update(roomId: number, request: AdminRoomUpdateRequest) {
    return (
      await call<AdminRoom>(() => authApiClient.patch(`/admin/rooms/${roomId}`, request))
    ).data
  },
}

export const adminFacilitiesApi = {
  async list() {
    return (await call<AdminFacility[]>(() => authApiClient.get('/admin/facilities'))).data
  },
  async detail(facilityId: number) {
    return (
      await call<AdminFacility>(() => authApiClient.get(`/admin/facilities/${facilityId}`))
    ).data
  },
  async create(request: AdminFacilityRequest) {
    return (
      await call<AdminFacility>(() => authApiClient.post('/admin/facilities', request))
    ).data
  },
  async update(facilityId: number, request: AdminFacilityUpdateRequest) {
    return (
      await call<AdminFacility>(() =>
        authApiClient.patch(`/admin/facilities/${facilityId}`, request),
      )
    ).data
  },
}
