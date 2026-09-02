// 관리자 회원 관리 도메인 타입. 백엔드 계약(member.user.dto)과 1:1로 맞춘다.
// 관리자 목록 API는 예약 API와 같은 snake_case 규격을 사용한다.
export type AdminMemberRole = 'USER' | 'ADMIN'

export type AdminMember = {
  user_id: number
  email: string
  name: string
  phone_number: string
  role: AdminMemberRole
  reservation_count: number
  inquiry_count: number
  created_at: string
}

export type AdminMemberDetail = AdminMember & {
  updated_at: string
}

export type AdminMemberPage = {
  user_list: AdminMember[]
  page_num: number
  page_size: number
  total_elements: number
  total_pages: number
}

export type AdminMemberStats = {
  total_users: number
  admin_users: number
  general_users: number
  new_users_today: number
  new_users_last_7_days: number
}

export type AdminMemberActivity = {
  user_id: number
  reservations: {
    resv_id: number
    resv_number: string
    room_name: string
    room_number: string
    check_in_date: string
    check_out_date: string
    guest_count: number
    total_price: number
    resv_status: string
    created_at: string
  }[]
  inquiries: {
    inquiry_id: number
    title: string
    status: 'WAITING' | 'ANSWERED'
    answered_at: string | null
    created_at: string
  }[]
}

export type AdminMemberFilters = {
  role?: AdminMemberRole
  keyword?: string
  page_num: number
  page_size: number
}
