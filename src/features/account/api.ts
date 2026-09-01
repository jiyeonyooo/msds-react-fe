import { authApiClient } from '../../lib/apiClient'
import { call } from '../../lib/apiError'
import { authApi } from '../auth/api'
import type { UserProfile } from '../auth/types'

// PATCH /api/users/me 요청. 서버가 비어 있지 않은 필드만 반영하는 부분 수정 방식이다.
export type ProfileUpdateRequest = { name?: string; phoneNumber?: string }
export type ProfileUpdateResponse = {
  userId: number
  email: string
  name: string
  phoneNumber: string
  updatedAt: string
}

export const accountApi = {
  // 내 정보 조회는 인증 세션과 같은 요청이라 auth 모듈의 것을 그대로 사용한다.
  me: (): Promise<{ data: UserProfile }> => authApi.me(),

  update: (data: ProfileUpdateRequest) =>
    call<ProfileUpdateResponse>(() => authApiClient.patch('/users/me', data)),

  // 회원 탈퇴는 본인 확인을 위해 비밀번호를 다시 받는다(불일치 시 400 PASSWORD_MISMATCH).
  remove: (password: string) =>
    call<null>(() => authApiClient.delete('/users/me', { data: { password } })),
}
