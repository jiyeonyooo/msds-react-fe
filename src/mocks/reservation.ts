import { getDevAuthState } from '../dev/auth'
import { getDevScenario, isDevMode } from '../dev/scenarios'
import { ApiRequestError } from '../lib/api/errors'
import type { ApiErrorDetail } from '../lib/api/types'
import type { AvailabilityResult, Reservation } from '../features/reservation/types'

type MockResult<T> = { handled: boolean; data?: T; error?: ApiRequestError }

const demoAvailability: AvailabilityResult = {
  check_in_date: '2026-09-12',
  check_out_date: '2026-09-14',
  guest_count: 2,
  nights: 2,
  rooms: [
    {
      room_id: 1,
      room_name: 'Ocean Silence Suite',
      description: '바다와 하늘을 고요하게 만나는 객실',
      max_guest_count: 2,
      base_price: 280000,
      total_price: 560000,
      nights: 2,
      available: true,
      remaining_count: 2,
    },
  ],
}
const demoReservation: Reservation = {
  resv_id: 101,
  reservation_number: 'RSV-20260912-A13F59C',
  room_name: 'Ocean Silence Suite',
  room_number: '203',
  check_in_date: '2026-09-12',
  check_out_date: '2026-09-14',
  guest_count: 2,
  nights: 2,
  base_price: 280000,
  total_price: 560000,
  status: 'RESERVED',
  created_at: '2026-09-01T14:22:00',
}

/** 개발 화면의 상태 확인용 응답. 실제 API 호출과 분리해 둔다. */
export async function reservationMock<T>(path: string, method = 'GET'): Promise<MockResult<T>> {
  if (!isDevMode) return { handled: false }
  const fail = (status: number, code: string, message: string, errors: ApiErrorDetail[] = []) =>
    ({ handled: true, error: new ApiRequestError(status, code, message, errors) }) as MockResult<T>
  const protectedRequest =
    path.startsWith('/resv/me') || /^\/resv\/\d/.test(path) || method === 'POST'
  if (getDevAuthState() === 'guest' && protectedRequest)
    return fail(401, 'AUTH_UNAUTHORIZED', '로그인이 필요합니다.')

  const scenario = getDevScenario()
  if (scenario === 'live') return { handled: false }
  if (scenario === 'loading') {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return { handled: false }
  }
  if (scenario === 'validation')
    return fail(422, 'VALIDATION_FAILED', '입력 값을 확인해 주세요.', [
      {
        field: 'check_out_date',
        reason: 'InvalidDateRange',
        message: '체크아웃은 체크인 이후여야 합니다.',
      },
    ])
  if (scenario === 'unauthorized') return fail(401, 'AUTH_UNAUTHORIZED', '로그인이 필요합니다.')
  if (scenario === 'forbidden') return fail(403, 'RESV_ACCESS_DENIED', '권한이 없습니다.')
  if (scenario === 'not-found') return fail(404, 'RESV_NOT_FOUND', '예약을 찾을 수 없습니다.')
  if (scenario === 'room-conflict' && method === 'POST')
    return fail(409, 'ROOM_NOT_AVAILABLE', '선택한 기간에 예약 가능한 객실이 없습니다.')
  if (scenario === 'cancel-conflict' && path.endsWith('/cancel'))
    return fail(409, 'RESV_CANNOT_CANCEL', '취소할 수 없는 예약입니다.')
  if (scenario === 'empty') {
    if (path === '/resv') return { handled: true, data: { ...demoAvailability, rooms: [] } as T }
    if (path === '/resv/me')
      return {
        handled: true,
        data: { content: [], page_num: 0, page_size: 10, total_elements: 0, total_pages: 0 } as T,
      }
  }
  if (scenario === 'demo') {
    if (path === '/resv') return { handled: true, data: demoAvailability as T }
    if (path === '/resv/me')
      return {
        handled: true,
        data: {
          content: [demoReservation],
          page_num: 0,
          page_size: 10,
          total_elements: 1,
          total_pages: 1,
        } as T,
      }
    if (method === 'POST') return { handled: true, data: demoReservation as T }
    if (path.endsWith('/cancel'))
      return {
        handled: true,
        data: { resv_id: 101, status: 'CANCELLED', cancelled_at: '2026-09-02T10:14:00' } as T,
      }
    if (/^\/resv\/\d/.test(path)) return { handled: true, data: demoReservation as T }
  }
  return { handled: false }
}
