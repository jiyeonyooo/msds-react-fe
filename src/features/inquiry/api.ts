import { authApiClient } from '../../lib/apiClient'
import { call } from '../../lib/apiError'
import type { Inquiry, InquiryCreateRequest } from './types'

// 모두 로그인이 필요한 요청이라 authApiClient가 Authorization 헤더를 붙여 보낸다.
export const inquiryApi = {
  // 문의 작성: 201 CREATED + 생성된 문의
  create: (data: InquiryCreateRequest) =>
    call<Inquiry>(() => authApiClient.post('/inquiries', data)),

  // 내 문의 목록(페이징 없이 전체 목록)
  mine: () => call<Inquiry[]>(() => authApiClient.get('/inquiries')),

  // 내 문의 상세(본인 소유 문의만 조회 가능, 아니면 403)
  detail: (inquiryId: string) => call<Inquiry>(() => authApiClient.get(`/inquiries/${inquiryId}`)),
}
