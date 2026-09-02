import { authApiClient } from '../../lib/apiClient'
import { ApiError, call, type ApiEnvelope } from '../../lib/apiError'
import { adminMemberMock } from '../../mocks/adminMember'
import type {
  AdminMemberDetail,
  AdminMemberFilters,
  AdminMemberPage,
  AdminMemberReservations,
} from './memberTypes'

async function request<T>(config: Parameters<typeof authApiClient.request>[0]) {
  const body = await call<T>(() => authApiClient.request<ApiEnvelope<T>>(config))
  if (body.code !== 'OK') throw new ApiError(200, body.code, body.message)
  return body.data
}

export const adminMemberApi = {
  list: (filters: AdminMemberFilters) => withMock('/admin/members', 'GET', filters, () =>
    request<AdminMemberPage>({ url: '/admin/members', params: filters })),
  detail: (memberId: string) => withMock(`/admin/members/${memberId}`, 'GET', undefined, () =>
    request<AdminMemberDetail>({ url: `/admin/members/${memberId}` })),
  reservations: (memberId: string, pageNum = 0) => withMock(`/admin/members/${memberId}/resv`, 'GET', undefined, () =>
    request<AdminMemberReservations>({ url: `/admin/members/${memberId}/resv`, params: { page_num: pageNum, page_size: 10 } })),
  remove: (memberId: string) => withMock(`/admin/members/${memberId}`, 'DELETE', undefined, () =>
    request<null>({ url: `/admin/members/${memberId}`, method: 'DELETE' })),
}

async function withMock<T>(path: string, method: string, filters: AdminMemberFilters | undefined, run: () => Promise<T>) {
  const mock = await adminMemberMock<T>(path, method, filters)
  if (!mock.handled) return run()
  if (mock.error) throw mock.error
  return mock.data as T
}
