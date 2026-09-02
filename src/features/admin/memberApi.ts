import { authApiClient } from '../../lib/apiClient'
import { call } from '../../lib/apiError'
import type {
  AdminMemberActivity,
  AdminMemberDetail,
  AdminMemberFilters,
  AdminMemberPage,
  AdminMemberRole,
  AdminMemberStats,
} from './memberTypes'

type AdminUserWire = {
  userId: number
  email: string
  name: string
  phoneNumber: string
  role: string
  createdAt: string
}

type AdminUserDetailWire = AdminUserWire & { updatedAt: string | null }

type AdminUserPageWire = {
  content: AdminUserWire[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  userCount: number
  adminCount: number
}

function toRole(role: string): AdminMemberRole {
  return role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'
}

function toMember(user: AdminUserWire) {
  return {
    user_id: user.userId,
    email: user.email,
    name: user.name,
    phone_number: user.phoneNumber,
    role: toRole(user.role),
    reservation_count: 0,
    inquiry_count: 0,
    created_at: user.createdAt,
  }
}

/** 현재 백엔드의 관리자 회원 목록·상세 계약을 화면 모델로 변환한다. */
export const adminMemberApi = {
  list: async (filters: AdminMemberFilters) => {
    const response = await call<AdminUserPageWire>(() => authApiClient.get('/admin/users', {
      params: {
        role: filters.role,
        keyword: filters.keyword,
        page: filters.page_num,
        size: filters.page_size,
      },
    }))
    const data: AdminMemberPage = {
      user_list: response.data.content.map(toMember),
      page_num: response.data.pageNumber,
      page_size: response.data.pageSize,
      total_elements: response.data.totalElements,
      total_pages: response.data.totalPages,
    }
    return { ...response, data }
  },

  stats: async () => {
    const response = await call<AdminUserPageWire>(() => authApiClient.get('/admin/users', {
      params: { page: 0, size: 1 },
    }))
    const data: AdminMemberStats = {
      total_users: response.data.totalElements,
      admin_users: response.data.adminCount,
      general_users: response.data.userCount,
      new_users_today: 0,
      new_users_last_7_days: 0,
    }
    return { ...response, data }
  },

  detail: async (userId: string) => {
    const response = await call<AdminUserDetailWire>(() => authApiClient.get(`/admin/users/${userId}`))
    const data: AdminMemberDetail = {
      ...toMember(response.data),
      updated_at: response.data.updatedAt ?? response.data.createdAt,
    }
    return { ...response, data }
  },

  activity: async (userId: string) => {
    const data: AdminMemberActivity = {
      user_id: Number(userId),
      reservations: [],
      inquiries: [],
    }
    return { code: 'OK', message: '활동 이력 API 준비 중입니다.', data }
  },
}
