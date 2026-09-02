import { authApiClient, publicApiClient } from '../../lib/apiClient'
import { ApiError, call, type ApiEnvelope } from '../../lib/apiError'
import { reservationMock } from '../../mocks/reservation'
import type {
  AvailabilityRequest,
  AvailabilityResult,
  AvailableRoom,
  CancellationResult,
  PageData,
  Reservation,
  ReservationRequest,
  ReservationStatus,
} from './types'

export { ApiError } from '../../lib/apiError'

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
async function withMock<T>(path: string, method: string, request: () => Promise<T>): Promise<T> {
  const mock = await reservationMock<T>(path, method)
  if (mock.handled) {
    if (mock.error) throw mock.error
    return mock.data as T
  }
  return request()
}
async function request<T>(client: typeof authApiClient, config: Parameters<typeof authApiClient.request>[0]) {
  const body = await call<T>(() => client.request<ApiEnvelope<T>>(config))
  if (body.code !== 'OK') throw new ApiError(200, body.code, body.message)
  return body.data
}
export const reservationApi = {
  availability: (params: AvailabilityRequest) =>
    withMock('/resv', 'GET', async () =>
      mapAvailability(
        await request<AvailabilityResponse>(publicApiClient, { url: '/resv', params }),
      ),
    ),
  create: (data: ReservationRequest) =>
    withMock('/resv', 'POST', async () =>
      mapReservation(
        await request<ReservationResponse>(authApiClient, {
          url: '/resv',
          method: 'POST',
          data,
        }),
      ),
    ),
  mine: ({
    status,
    page = 0,
    pageSize = 10,
  }: { status?: ReservationStatus; page?: number; pageSize?: number } = {}) =>
    withMock('/resv/me', 'GET', async () => {
      const data = await request<ReservationPageResponse>(authApiClient, {
        url: '/resv/me',
        params: { ...(status ? { resv_status: status } : {}), page_num: page, page_size: pageSize },
      })
      return {
        ...data,
        content: data.resv_list.map(mapReservation),
      } satisfies PageData<Reservation>
    }),
  detail: (id: string) =>
    withMock(`/resv/${id}`, 'GET', async () =>
      mapReservation(await request<ReservationResponse>(authApiClient, { url: `/resv/${id}` })),
    ),
  cancel: (id: string) =>
    withMock(`/resv/${id}/cancel`, 'PATCH', async () => {
      const data = await request<CancellationResponse>(authApiClient, {
        url: `/resv/${id}/cancel`,
        method: 'PATCH',
      })
      return {
        resv_id: data.resv_id,
        status: data.resv_status,
        ...(data.cancelled_at ? { cancelled_at: data.cancelled_at } : {}),
      } satisfies CancellationResult
    }),
}
