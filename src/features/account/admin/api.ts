import { authApiClient } from '../../../lib/apiClient'
import { call } from '../../../lib/apiError'
import type { AdminUserDetail, AdminUserList, AdminUserRole } from './types'

export const adminUsersApi = {
  async list(params: {
    keyword?: string
    role?: AdminUserRole
    page?: number
    size?: number
  } = {}) {
    return (await call<AdminUserList>(() => authApiClient.get('/admin/users', { params }))).data
  },

  async detail(userId: number) {
    return (
      await call<AdminUserDetail>(() => authApiClient.get(`/admin/users/${userId}`))
    ).data
  },
}
