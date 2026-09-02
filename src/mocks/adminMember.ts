import { getDevAuthState } from '../dev/auth'
import { getDevScenario, isDevMode } from '../dev/scenarios'
import { ApiError } from '../lib/apiError'
import { getAccessToken } from '../lib/authToken'
import type { AdminMemberDetail, AdminMemberFilters, AdminMemberPage, AdminMemberReservations } from '../features/admin/memberTypes'

type MockResult<T> = { handled: boolean; data?: T; error?: ApiError }

const members: AdminMemberDetail[] = [
  { member_id: 51, name: '김미소', email: 'miso@example.com', phone_number: '010-1234-5678', role: 'MEMBER', created_at: '2026-06-12T10:22:00', updated_at: '2026-08-30T14:10:00' },
  { member_id: 52, name: '이하늘', email: 'haneul@example.com', phone_number: '010-9876-5432', role: 'MEMBER', created_at: '2026-07-03T16:45:00', updated_at: null },
]

const reservations: AdminMemberReservations['resv_list'] = [
  { resv_id: 1001, resv_number: 'RSV-20260912-1001', member_name: '김미소', room_name: '2인 개인실', room_number: '203', check_in_date: '2026-09-12', check_out_date: '2026-09-14', guest_count: 2, total_price: 560000, resv_status: 'RESERVED', created_at: '2026-09-01T14:22:00' },
]

export async function adminMemberMock<T>(path: string, method: string, filters?: AdminMemberFilters): Promise<MockResult<T>> {
  if (!isDevMode || getDevAuthState() !== 'admin' || getAccessToken()) return { handled: false }
  const fail = (status: number, code: string, message: string) => ({ handled: true, error: new ApiError(status, code, message) }) as MockResult<T>
  const scenario = getDevScenario()
  if (scenario === 'loading') await new Promise((resolve) => setTimeout(resolve, 1500))
  if (scenario === 'unauthorized') return fail(401, 'AUTH_UNAUTHORIZED', '로그인이 필요합니다.')
  if (scenario === 'forbidden') return fail(403, 'AUTH_FORBIDDEN', '관리자 권한이 필요합니다.')
  if (scenario === 'not-found' && path !== '/admin/members') return fail(404, 'MEMBER_NOT_FOUND', '회원 정보를 찾을 수 없습니다.')
  if (path === '/admin/members') {
    const keyword = filters?.keyword?.toLocaleLowerCase('ko-KR')
    const content = scenario === 'empty' ? [] : members.filter((member) => !keyword || member.name.toLocaleLowerCase('ko-KR').includes(keyword) || member.email.toLocaleLowerCase('ko-KR').includes(keyword))
    return { handled: true, data: { member_list: content, page_num: filters?.page_num ?? 0, page_size: filters?.page_size ?? 10, total_elements: content.length, total_pages: content.length ? 1 : 0 } satisfies AdminMemberPage as T }
  }
  const memberId = Number(path.split('/')[3])
  const member = members.find((item) => item.member_id === memberId)
  if (!member) return fail(404, 'MEMBER_NOT_FOUND', '회원 정보를 찾을 수 없습니다.')
  if (method === 'DELETE') {
    members.splice(members.indexOf(member), 1)
    return { handled: true, data: null as T }
  }
  if (path.endsWith('/resv')) {
    const content = reservations.filter((reservation) => reservation.member_name === member.name)
    return { handled: true, data: { resv_list: content, page_num: 0, page_size: 10, total_elements: content.length, total_pages: content.length ? 1 : 0 } satisfies AdminMemberReservations as T }
  }
  return { handled: true, data: member as T }
}
