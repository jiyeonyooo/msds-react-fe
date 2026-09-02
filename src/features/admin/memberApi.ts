import { authApiClient } from '../../lib/apiClient'
import { ApiError, call, type ApiEnvelope } from '../../lib/apiError'
import { adminMemberMock } from '../../mocks/adminMember'
import type {
  AdminMember,
  AdminMemberDetail,
  AdminMemberFilters,
  AdminMemberReservations,
} from './memberTypes'

type AdminUserWire = {
  userId: number
  email: string
  name: string
  phoneNumber: string
  role: string
  createdAt: string
}

type AdminUserDetailWire = AdminUserWire & { updatedAt: string | null }

type AdminUserPageWire = {
  content: AdminUserWire[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

async function request<T>(config: Parameters<typeof authApiClient.request>[0]) {
  const body = await call<T>(() => authApiClient.request<ApiEnvelope<T>>(config))
  if (body.code !== 'OK') throw new ApiError(200, body.code, body.message)
  return body.data
}

export const adminMemberApi = {
  list: (filters: AdminMemberFilters) => withMock('/admin/members', 'GET', filters, () =>
    request<AdminUserPageWire>({
      url: '/admin/users',
      params: { keyword: filters.keyword, page: filters.page_num, size: filters.page_size },
    }).then((page) => ({
      member_list: page.content.map(toMember),
      page_num: page.pageNumber,
      page_size: page.pageSize,
      total_elements: page.totalElements,
      total_pages: page.totalPages,
    }))),
  detail: (memberId: string) => withMock(`/admin/members/${memberId}`, 'GET', undefined, () =>
    getMemberDetail(memberId)),
  reservations: (memberId: string, pageNum = 0) => withMock(`/admin/members/${memberId}/resv`, 'GET', undefined, () =>
    getMemberReservations(memberId, pageNum)),
  remove: (memberId: string) => withMock(`/admin/members/${memberId}`, 'DELETE', undefined, () =>
    request<null>({ url: `/admin/members/${memberId}`, method: 'DELETE' })),
}

function toMember(user: AdminUserWire): AdminMember {
  return {
    member_id: user.userId,
    name: user.name,
    email: user.email,
    phone_number: user.phoneNumber,
    role: user.role,
    created_at: user.createdAt,
  }
}

async function getMemberDetail(memberId: string): Promise<AdminMemberDetail> {
  const user = await request<AdminUserDetailWire>({ url: `/admin/users/${memberId}` })
  return { ...toMember(user), updated_at: user.updatedAt }
}

async function getMemberReservations(memberId: string, pageNum: number): Promise<AdminMemberReservations> {
  const member = await getMemberDetail(memberId)
  return request<AdminMemberReservations>({
    url: '/admin/resv',
    params: { keyword: member.name, page_num: pageNum, page_size: 10 },
  })
}

async function withMock<T>(path: string, method: string, filters: AdminMemberFilters | undefined, run: () => Promise<T>) {
  const mock = await adminMemberMock<T>(path, method, filters)
  if (!mock.handled) return run()
  if (mock.error) throw mock.error
  return mock.data as T
}
