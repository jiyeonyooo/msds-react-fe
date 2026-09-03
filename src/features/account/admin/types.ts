export type AdminUserRole = 'USER' | 'ADMIN'

export type AdminUserSummary = {
  userId: number
  email: string
  name: string
  phoneNumber: string
  role: AdminUserRole
  createdAt: string
}

export type AdminUserDetail = AdminUserSummary & {
  updatedAt: string
}

export type AdminUserList = {
  content: AdminUserSummary[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  userCount: number
  adminCount: number
}
