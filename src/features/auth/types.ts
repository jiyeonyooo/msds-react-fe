// 인증 도메인 요청/응답 타입. 백엔드 계약(member.auth.dto)과 1:1로 맞춘다.
export type ApiEnvelope<T> = { code: string; message: string; data: T }

// POST /api/auth/login
export type LoginRequest = { email: string; password: string }
export type LoginResponse = { accessToken: string }

// POST /api/auth/signup
export type SignupRequest = {
  email: string
  password: string
  name: string
  phoneNumber: string
}
export type SignupResponse = { email: string }

// GET /api/users/me
export type UserProfile = {
  userId: number
  email: string
  name: string
  phoneNumber: string
  role: string
  createdAt?: string
  updatedAt?: string
}

// 폼 필드 단위 에러. 키는 요청 DTO의 필드명과 같다.
export type FieldErrors = Partial<Record<string, string>>
