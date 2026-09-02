import { getDevAuthState } from '../dev/auth'
import { getDevScenario, isDevMode } from '../dev/scenarios'
import { ApiError } from '../lib/apiError'
import { getAccessToken } from '../lib/authToken'
import type { AdminMemberDetail, AdminMemberFilters, AdminMemberPage } from '../features/admin/memberTypes'

type MockResult<T> = { handled: boolean; data?: T; error?: ApiError }

const members: AdminMemberDetail[] = [
  { user_id: 51, name: '김미소', email: 'miso@example.com', phone_number: '010-1234-5678', role: 'USER', reservation_count: 1, inquiry_count: 0, created_at: '2026-06-12T10:22:00', updated_at: '2026-08-30T14:10:00' },
  { user_id: 52, name: '이하늘', email: 'haneul@example.com', phone_number: '010-9876-5432', role: 'USER', reservation_count: 0, inquiry_count: 1, created_at: '2026-07-03T16:45:00', updated_at: '2026-07-03T16:45:00' },
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
    return { handled: true, data: { user_list: content, page_num: filters?.page_num ?? 0, page_size: filters?.page_size ?? 10, total_elements: content.length, total_pages: content.length ? 1 : 0 } satisfies AdminMemberPage as T }
  }
  const memberId = Number(path.split('/')[3])
  const member = members.find((item) => item.user_id === memberId)
  if (!member) return fail(404, 'MEMBER_NOT_FOUND', '회원 정보를 찾을 수 없습니다.')
  if (method === 'DELETE') {
    members.splice(members.indexOf(member), 1)
    return { handled: true, data: null as T }
  }
  return { handled: true, data: member as T }
}
