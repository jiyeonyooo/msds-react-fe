import { authApiClient } from '../../lib/apiClient'
import { ApiError, call, type ApiEnvelope } from '../../lib/apiError'
import { adminReservationMock } from '../../mocks/adminReservation'
import type {
  AdminCancellationResult,
  AdminReservationDetail,
  AdminReservationFilters,
  AdminReservationPage,
} from './reservationTypes'

async function request<T>(config: Parameters<typeof authApiClient.request>[0]) {
  const body = await call<T>(() => authApiClient.request<ApiEnvelope<T>>(config))
  if (body.code !== 'OK') throw new ApiError(200, body.code, body.message)
  return body.data
}

async function withMock<T>(path: string, method: string, request: () => Promise<T>, filters?: AdminReservationFilters): Promise<T> {
  const mock = await adminReservationMock<T>(path, method, filters)
  if (mock.handled) {
    if (mock.error) throw mock.error
    return mock.data as T
  }
  return request()
}

export const adminReservationApi = {
  list: (filters: AdminReservationFilters) =>
    withMock('/admin/resv', 'GET', () => request<AdminReservationPage>({ url: '/admin/resv', params: filters }), filters),
  detail: (resvId: string) =>
    withMock(`/admin/resv/${resvId}`, 'GET', () => request<AdminReservationDetail>({ url: `/admin/resv/${resvId}` })),
  cancel: (resvId: string) =>
    withMock(`/admin/resv/${resvId}/status`, 'PATCH', () => request<AdminCancellationResult>({ url: `/admin/resv/${resvId}/status`, method: 'PATCH' })),
}
