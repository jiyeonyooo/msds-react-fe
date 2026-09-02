import { getDevAuthState } from '../dev/auth'
import { getDevScenario, isDevMode } from '../dev/scenarios'
import { ApiError, type ApiErrorDetail } from '../lib/apiError'
import { getAccessToken } from '../lib/authToken'
import type {
  AdminCancellationResult,
  AdminReservationDetail,
  AdminReservationFilters,
  AdminReservationPage,
} from '../features/admin/reservationTypes'

type MockResult<T> = { handled: boolean; data?: T; error?: ApiError }

const reservations: AdminReservationDetail[] = [
  {
    resv_id: 1001,
    resv_number: 'RSV-20260912-1001',
    member_name: '홍길동',
    phone_number: '010-1234-5678',
    room_name: '2인 개인실',
    room_number: '203',
    check_in_date: '2026-09-12',
    check_out_date: '2026-09-14',
    guest_count: 2,
    nights: 2,
    price_per_night: 280000,
    total_price: 560000,
    resv_status: 'RESERVED',
    created_at: '2026-09-01T14:22:00',
    cancelled_at: null,
  },
  {
    resv_id: 1002,
    resv_number: 'RSV-20260905-1002',
    member_name: '김민지',
    phone_number: '010-9876-5432',
    room_name: '4인 도미토리',
    room_number: '105',
    check_in_date: '2026-09-05',
    check_out_date: '2026-09-06',
    guest_count: 1,
    nights: 1,
    price_per_night: 80000,
    total_price: 80000,
    resv_status: 'CANCELLED',
    created_at: '2026-08-30T11:00:00',
    cancelled_at: '2026-09-01T09:15:00',
  },
]

export async function adminReservationMock<T>(
  path: string,
  method: string,
  filters?: AdminReservationFilters,
): Promise<MockResult<T>> {
  // 실제 관리자 로그인으로 받은 토큰이 있으면 DEV 패널 상태와 관계없이 실 API를 우선한다.
  // 토큰이 없는 가짜 ADMIN 상태에서만 화면 개발용 mock을 사용한다.
  if (!isDevMode || getDevAuthState() !== 'admin' || getAccessToken()) return { handled: false }

  const fail = (status: number, code: string, message: string, errors: ApiErrorDetail[] = []) =>
    ({ handled: true, error: new ApiError(status, code, message, {}, errors) }) as MockResult<T>
  const scenario = getDevScenario()
  if (scenario === 'loading') await new Promise((resolve) => setTimeout(resolve, 1500))
  if (scenario === 'unauthorized') return fail(401, 'AUTH_UNAUTHORIZED', '로그인이 필요합니다.')
  if (scenario === 'forbidden') return fail(403, 'AUTH_FORBIDDEN', '관리자 권한이 필요합니다.')
  if (scenario === 'validation') return fail(422, 'VALIDATION_FAILED', '요청 값이 유효하지 않습니다.', [{ field: 'search_to_date', reason: 'InvalidDateRange', message: '검색 종료일은 검색 시작일보다 이전일 수 없습니다.' }])
  if (scenario === 'not-found' && path !== '/admin/resv') return fail(404, 'RESV_NOT_FOUND', '예약 정보를 찾을 수 없습니다.')
  if (scenario === 'cancel-conflict' && method === 'PATCH') return fail(409, 'RESV_CANNOT_CANCEL', '취소할 수 없는 예약입니다.')

  if (path === '/admin/resv') {
    const keyword = filters?.keyword?.toLocaleLowerCase('ko-KR')
    const content = scenario === 'empty' ? [] : reservations.filter((reservation) =>
      (!filters?.resv_status || reservation.resv_status === filters.resv_status)
      && (!filters?.search_from_date || reservation.check_in_date >= filters.search_from_date)
      && (!filters?.search_to_date || reservation.check_in_date <= filters.search_to_date)
      && (!keyword || reservation.resv_number.toLocaleLowerCase('ko-KR').includes(keyword) || reservation.member_name.toLocaleLowerCase('ko-KR').includes(keyword)),
    )
    return { handled: true, data: { resv_list: content, page_num: 0, page_size: 10, total_elements: content.length, total_pages: content.length ? 1 : 0 } satisfies AdminReservationPage as T }
  }
  if (method === 'PATCH' && path.endsWith('/restore')) {
    const reservation = reservations.find((item) => path.endsWith(`/${item.resv_id}/restore`))
    if (!reservation) return fail(404, 'RESV_NOT_FOUND', '예약 정보를 찾을 수 없습니다.')
    const data: AdminCancellationResult = { resv_id: reservation.resv_id, resv_number: reservation.resv_number, resv_status: 'RESERVED', cancelled_at: null }
    return { handled: true, data: data as T }
  }
  if (method === 'PATCH') {
    const reservation = reservations.find((item) => path.endsWith(`/${item.resv_id}/status`))
    if (!reservation) return fail(404, 'RESV_NOT_FOUND', '예약 정보를 찾을 수 없습니다.')
    const data: AdminCancellationResult = { resv_id: reservation.resv_id, resv_number: reservation.resv_number, resv_status: 'CANCELLED', cancelled_at: '2026-09-02T10:14:00' }
    return { handled: true, data: data as T }
  }
  const reservation = reservations.find((item) => path.endsWith(`/${item.resv_id}`))
  return reservation ? { handled: true, data: reservation as T } : fail(404, 'RESV_NOT_FOUND', '예약 정보를 찾을 수 없습니다.')
}
