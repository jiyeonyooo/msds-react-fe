export type AdminReservationStatus = 'RESERVED' | 'CANCELLED'

export type AdminReservation = {
  resv_id: number
  resv_number: string
  member_name: string
  room_name: string
  room_number: string
  check_in_date: string
  check_out_date: string
  guest_count: number
  total_price: number
  resv_status: AdminReservationStatus
  created_at: string
}

export type AdminReservationDetail = AdminReservation & {
  phone_number: string
  nights: number
  price_per_night: number
  cancelled_at: string | null
}

export type AdminReservationPage = {
  resv_list: AdminReservation[]
  page_num: number
  page_size: number
  total_elements: number
  total_pages: number
}

export type AdminReservationFilters = {
  resv_status?: AdminReservationStatus
  search_from_date?: string
  search_to_date?: string
  keyword?: string
  page_num?: number
  page_size?: number
}

export type AdminCancellationResult = {
  resv_id: number
  resv_number: string
  resv_status: AdminReservationStatus
  cancelled_at: string | null
}
