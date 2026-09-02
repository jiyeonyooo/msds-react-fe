import { authApiClient } from '../../../lib/apiClient'
import { call } from '../../../lib/apiError'
import type {
  NoiseDevice,
  NoiseDeviceCreateRequest,
  NoiseDeviceStatus,
  NoiseMeasurement,
  NoiseMeasurementCreateRequest,
  QuietSpace,
  QuietSpaceCreateRequest,
} from './types'

export const adminQuietnessApi = {
  async getSpaces(guesthouseId: number) {
    return (
      await call<QuietSpace[]>(() =>
        authApiClient.get(`/admin/quietness/guesthouses/${guesthouseId}/spaces`),
      )
    ).data
  },

  async createSpace(request: QuietSpaceCreateRequest) {
    return (await call<QuietSpace>(() => authApiClient.post('/admin/quietness/spaces', request)))
      .data
  },

  async getDevices(guesthouseId: number) {
    return (
      await call<NoiseDevice[]>(() =>
        authApiClient.get(`/admin/quietness/guesthouses/${guesthouseId}/devices`),
      )
    ).data
  },

  async createDevice(request: NoiseDeviceCreateRequest) {
    return (await call<NoiseDevice>(() => authApiClient.post('/admin/quietness/devices', request)))
      .data
  },

  async updateDeviceStatus(deviceId: number, status: NoiseDeviceStatus) {
    return (
      await call<NoiseDevice>(() =>
        authApiClient.patch(`/admin/quietness/devices/${deviceId}/status`, { status }),
      )
    ).data
  },

  async createMeasurement(request: NoiseMeasurementCreateRequest) {
    return (
      await call<NoiseMeasurement>(() =>
        authApiClient.post('/admin/quietness/measurements', request),
      )
    ).data
  },
}
