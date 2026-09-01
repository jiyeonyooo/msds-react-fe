export type ReservationStatus = 'RESERVED' | 'CANCELLED'

export type ApiErrorDetail = { field: string; reason: string; message: string }
export type ApiEnvelope<T> = { code: string; message: string; data: T }

export type AvailabilityRequest = {
  check_in_date: string
  check_out_date: string
  guest_count: number
}

export type AvailableRoom = {
  room_id: number
  room_name: string
  description?: string
  max_guest_count: number
  base_price: number
  total_price: number
  nights: number
  available: boolean
  remaining_count: number
  image_url?: string
}

export type AvailabilityResult = AvailabilityRequest & {
  nights: number
  rooms: AvailableRoom[]
}

export type ReservationRequest = AvailabilityRequest & { room_id: number }

export type Reservation = {
  resv_id: number
  reservation_number: string
  room_name: string
  room_number?: string
  check_in_date: string
  check_out_date: string
  guest_count: number
  nights?: number
  base_price?: number
  total_price: number
  status: ReservationStatus
  created_at?: string
  cancelled_at?: string
}

export type PageData<T> = {
  content: T[]
  page_num: number
  page_size: number
  total_elements: number
  total_pages: number
}

export type CancellationResult = Pick<Reservation, 'resv_id' | 'status' | 'cancelled_at'>
