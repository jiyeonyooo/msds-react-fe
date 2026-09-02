import type { AdminReservation } from './reservationTypes'

export type AdminMember = {
  member_id: number
  name: string
  email: string
  phone_number: string
  role: string
  created_at: string
}

export type AdminMemberDetail = AdminMember & {
  updated_at: string | null
}

export type AdminMemberPage = {
  member_list: AdminMember[]
  page_num: number
  page_size: number
  total_elements: number
  total_pages: number
}

export type AdminMemberFilters = {
  keyword?: string
  page_num?: number
  page_size?: number
}

export type AdminMemberReservations = {
  resv_list: AdminReservation[]
  page_num: number
  page_size: number
  total_elements: number
  total_pages: number
}
