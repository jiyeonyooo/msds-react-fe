import axios, { type AxiosInstance } from 'axios'
import { getDevAuthState } from '../../dev/auth'
import { getDevScenario, isDevMode } from '../../dev/scenarios'
import { authApiClient, publicApiClient } from '../../lib/apiClient'
import type {
  ApiEnvelope,
  ApiErrorDetail,
  AvailabilityRequest,
  AvailabilityResult,
  AvailableRoom,
  CancellationResult,
  PageData,
  Reservation,
  ReservationRequest,
  ReservationStatus,
} from './types'

export class ApiError extends Error {
  status: number
  code: string
  errors: ApiErrorDetail[]

  constructor(
    status: number,
    code: string,
    message: string,
    errors: ApiErrorDetail[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
  }
}

type ApiErrorData = { errors?: ApiErrorDetail[] } | null
type AvailabilityResponse = AvailabilityRequest & {
  nights: number
  rooms: Array<{
    room_id: number
    room_name: string
    max_guests: number
    remaining_count: number
    base_price: number
    total_price: number
    available: boolean
  }>
}
type ReservationResponse = {
  resv_id: number
  resv_number: string
  room_name: string
  room_number?: string | null
  check_in_date: string
  check_out_date: string
  guest_count: number
  nights?: number
  price_per_night?: number
  total_price: number
  resv_status: ReservationStatus
  created_at?: string | null
  cancelled_at?: string | null
}
type ReservationPageResponse = {
  resv_list: ReservationResponse[]
  page_num: number
  page_size: number
  total_elements: number
  total_pages: number
}
type CancellationResponse = {
  resv_id: number
  resv_status: ReservationStatus
  cancelled_at?: string | null
}
type MockResult<T> = { handled: boolean; data?: T; error?: ApiError }

const demoAvailability: AvailabilityResult = {
  check_in_date: '2026-09-12',
  check_out_date: '2026-09-14',
  guest_count: 2,
  nights: 2,
  rooms: [
    {
      room_id: 1,
      room_name: 'Ocean Silence Suite',
      description: '바다와 하늘이 고요하게 만나는 객실',
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

function mapReservation(data: ReservationResponse): Reservation {
  return {
    resv_id: data.resv_id,
    reservation_number: data.resv_number,
    room_name: data.room_name,
    ...(data.room_number ? { room_number: data.room_number } : {}),
    check_in_date: data.check_in_date,
    check_out_date: data.check_out_date,
    guest_count: data.guest_count,
    ...(data.nights === undefined ? {} : { nights: data.nights }),
    ...(data.price_per_night === undefined ? {} : { base_price: data.price_per_night }),
    total_price: data.total_price,
    status: data.resv_status,
    ...(data.created_at ? { created_at: data.created_at } : {}),
    ...(data.cancelled_at ? { cancelled_at: data.cancelled_at } : {}),
  }
}

function mapAvailability(data: AvailabilityResponse): AvailabilityResult {
  return {
    check_in_date: data.check_in_date,
    check_out_date: data.check_out_date,
    guest_count: data.guest_count,
    nights: data.nights,
    rooms: data.rooms.map((room): AvailableRoom => ({
      room_id: room.room_id,
      room_name: room.room_name,
      max_guest_count: room.max_guests,
      remaining_count: room.remaining_count,
      base_price: room.base_price,
      total_price: room.total_price,
      available: room.available,
      nights: data.nights,
    })),
  }
}

async function request<T>(client: AxiosInstance, config: Parameters<AxiosInstance['request']>[0]) {
  try {
    const response = await client.request<ApiEnvelope<T>>(config)
    const body = response.data
    if (!body || typeof body !== 'object' || !('code' in body))
      throw new ApiError(response.status, 'API_INVALID_RESPONSE', 'API 서버 응답을 확인할 수 없습니다.')
    if (body.code !== 'OK') throw new ApiError(response.status, body.code, body.message)
    return body.data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (axios.isAxiosError<ApiEnvelope<ApiErrorData>>(error)) {
      const body = error.response?.data
      if (error.response && body && typeof body === 'object' && 'code' in body) {
        throw new ApiError(error.response.status, body.code, body.message, body.data?.errors ?? [])
      }
    }
    throw new ApiError(0, 'API_NETWORK_ERROR', 'API 서버에 연결할 수 없습니다.')
  }
}

async function devResponse<T>(path: string, method = 'GET'): Promise<MockResult<T>> {
  if (!isDevMode) return { handled: false }
  const error = (status: number, code: string, message: string, errors: ApiErrorDetail[] = []) =>
    ({ handled: true, error: new ApiError(status, code, message, errors) }) as MockResult<T>
  const protectedRequest = path.startsWith('/resv/me') || /^\/resv\/\d/.test(path) || method === 'POST'
  if (getDevAuthState() === 'guest' && protectedRequest)
    return error(401, 'AUTH_UNAUTHORIZED', '로그인이 필요합니다.')

  const scenario = getDevScenario()
  if (scenario === 'live') return { handled: false }
  if (scenario === 'loading') {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return { handled: false }
  }
  if (scenario === 'validation')
    return error(422, 'VALIDATION_FAILED', '입력 값을 확인해 주세요.', [
      { field: 'check_out_date', reason: 'InvalidDateRange', message: '체크아웃은 체크인 이후여야 합니다.' },
    ])
  if (scenario === 'unauthorized') return error(401, 'AUTH_UNAUTHORIZED', '로그인이 필요합니다.')
  if (scenario === 'forbidden') return error(403, 'RESV_ACCESS_DENIED', '권한이 없습니다.')
  if (scenario === 'not-found') return error(404, 'RESV_NOT_FOUND', '예약을 찾을 수 없습니다.')
  if (scenario === 'room-conflict' && method === 'POST')
    return error(409, 'ROOM_NOT_AVAILABLE', '선택한 기간에 예약 가능한 객실이 없습니다.')
  if (scenario === 'cancel-conflict' && path.endsWith('/cancel'))
    return error(409, 'RESV_CANNOT_CANCEL', '취소할 수 없는 예약입니다.')
  if (scenario === 'empty') {
    if (path === '/resv') return { handled: true, data: { ...demoAvailability, rooms: [] } as T }
    if (path === '/resv/me')
      return { handled: true, data: { content: [], page_num: 0, page_size: 10, total_elements: 0, total_pages: 0 } as T }
  }
  if (scenario === 'demo') {
    if (path === '/resv') return { handled: true, data: demoAvailability as T }
    if (path === '/resv/me')
      return { handled: true, data: { content: [demoReservation], page_num: 0, page_size: 10, total_elements: 1, total_pages: 1 } as T }
    if (method === 'POST') return { handled: true, data: demoReservation as T }
    if (path.endsWith('/cancel'))
      return { handled: true, data: { resv_id: 101, status: 'CANCELLED', cancelled_at: '2026-09-02T10:14:00' } as T }
    if (/^\/resv\/\d/.test(path)) return { handled: true, data: demoReservation as T }
  }
  return { handled: false }
}

export const reservationApi = {
  async availability(params: AvailabilityRequest) {
    const mocked = await devResponse<AvailabilityResult>('/resv')
    if (mocked.handled) {
      if (mocked.error) throw mocked.error
      return mocked.data as AvailabilityResult
    }
    return mapAvailability(await request<AvailabilityResponse>(publicApiClient, { url: '/resv', params }))
  },
  async create(data: ReservationRequest) {
    const mocked = await devResponse<Reservation>('/resv', 'POST')
    if (mocked.handled) {
      if (mocked.error) throw mocked.error
      return mocked.data as Reservation
    }
    return mapReservation(await request<ReservationResponse>(authApiClient, { url: '/resv', method: 'POST', data }))
  },
  async mine({ status, page = 0, pageSize = 10 }: { status?: ReservationStatus; page?: number; pageSize?: number } = {}) {
    const mocked = await devResponse<PageData<Reservation>>('/resv/me')
    if (mocked.handled) {
      if (mocked.error) throw mocked.error
      return mocked.data as PageData<Reservation>
    }
    const data = await request<ReservationPageResponse>(authApiClient, {
      url: '/resv/me',
      params: { ...(status ? { resv_status: status } : {}), page_num: page, page_size: pageSize },
    })
    return { ...data, content: data.resv_list.map(mapReservation) }
  },
  async detail(id: string) {
    const mocked = await devResponse<Reservation>(`/resv/${id}`)
    if (mocked.handled) {
      if (mocked.error) throw mocked.error
      return mocked.data as Reservation
    }
    return mapReservation(await request<ReservationResponse>(authApiClient, { url: `/resv/${id}` }))
  },
  async cancel(id: string): Promise<CancellationResult> {
    const mocked = await devResponse<CancellationResult>(`/resv/${id}/cancel`, 'PATCH')
    if (mocked.handled) {
      if (mocked.error) throw mocked.error
      return mocked.data as CancellationResult
    }
    const data = await request<CancellationResponse>(authApiClient, { url: `/resv/${id}/cancel`, method: 'PATCH' })
    return { resv_id: data.resv_id, status: data.resv_status, ...(data.cancelled_at ? { cancelled_at: data.cancelled_at } : {}) }
  },
}
