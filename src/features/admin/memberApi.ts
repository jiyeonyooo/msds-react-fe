import { authApiClient } from '../../lib/apiClient'
import { call } from '../../lib/apiError'
import type {
  AdminMember,
  AdminMemberActivity,
  AdminMemberDetail,
  AdminMemberFilters,
  AdminMemberPage,
  AdminMemberRole,
  AdminMemberStats,
} from './memberTypes'

/**
 * 관리자 회원 API.
 *
 * 백엔드(member.user.dto)는 관리자 예약 API와 같은 snake_case 규격을 쓴다.
 * memberTypes 의 화면 모델이 이미 그 규격과 1:1이라 변환할 것이 거의 없다.
 * role 만 서버가 문자열로 들고 있어 대문자로 맞춰 준다.
 */

function toRole(role: string): AdminMemberRole {
  return role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'
}

function withRole<T extends { role: string }>(user: T) {
  return { ...user, role: toRole(user.role) }
}

export const adminMemberApi = {
  list: async (filters: AdminMemberFilters) => {
    const response = await call<AdminMemberPage>(() =>
      authApiClient.get('/admin/users', {
        params: {
          role: filters.role,
          keyword: filters.keyword,
          page_num: filters.page_num,
          page_size: filters.page_size,
        },
      }),
    )
    const data: AdminMemberPage = {
      ...response.data,
      user_list: (response.data.user_list ?? []).map((user) => withRole(user) as AdminMember),
    }
    return { ...response, data }
  },

  stats: () => call<AdminMemberStats>(() => authApiClient.get('/admin/users/stats')),

  detail: async (userId: string) => {
    const response = await call<AdminMemberDetail>(() =>
      authApiClient.get(`/admin/users/${userId}`),
    )
    return { ...response, data: withRole(response.data) as AdminMemberDetail }
  },

  activity: (userId: string) =>
    call<AdminMemberActivity>(() => authApiClient.get(`/admin/users/${userId}/activity`)),
}
