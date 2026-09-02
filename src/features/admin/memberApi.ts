import { authApiClient } from '../../lib/apiClient'
import { call } from '../../lib/apiError'
import type {
  AdminMemberActivity,
  AdminMemberDetail,
  AdminMemberFilters,
  AdminMemberPage,
  AdminMemberRole,
  AdminMemberStats,
} from './memberTypes'

/**
 * 관리자 회원 관리 API.
 * 검색·필터·페이징은 모두 서버가 처리하므로 화면은 파라미터만 그대로 전달한다.
 * 접근 제어는 서버의 /api/admin/** (ROLE_ADMIN)에서 처리한다.
 */
export const adminMemberApi = {
  // 회원 목록. role/keyword는 값이 있을 때만 붙인다.
  list: (filters: AdminMemberFilters) =>
    call<AdminMemberPage>(() => authApiClient.get('/admin/users', { params: filters })),

  // 대시보드용 회원 집계
  stats: () => call<AdminMemberStats>(() => authApiClient.get('/admin/users/stats')),

  // 회원 상세(예약·문의 건수 포함)
  detail: (userId: string) =>
    call<AdminMemberDetail>(() => authApiClient.get(`/admin/users/${userId}`)),

  // 회원의 예약·문의 이력
  activity: (userId: string) =>
    call<AdminMemberActivity>(() => authApiClient.get(`/admin/users/${userId}/activity`)),

  // 이름·전화번호 정정. 값이 있는 필드만 반영된다.
  update: (userId: string, data: { name?: string; phoneNumber?: string }) =>
    call<AdminMemberDetail>(() => authApiClient.patch(`/admin/users/${userId}`, data)),

  // 권한 변경. 본인 계정과 마지막 관리자는 서버가 400으로 거른다.
  changeRole: (userId: string, role: AdminMemberRole) =>
    call<AdminMemberDetail>(() => authApiClient.patch(`/admin/users/${userId}/role`, { role })),
}
