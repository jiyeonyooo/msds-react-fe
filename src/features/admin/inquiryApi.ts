import { authApiClient } from '../../lib/apiClient'
import { call } from '../../lib/apiError'
import type { Inquiry, InquiryStatus } from '../inquiry/types'

/**
 * 관리자 문의 API. 회원용 /api/inquiries와 달리 작성자와 무관하게 전체 문의를 다룬다.
 * 접근 제어는 서버의 /api/admin/** (ROLE_ADMIN)에서 처리한다.
 */
export const adminInquiryApi = {
  // 전체 문의 목록. status를 주면 해당 상태(WAITING/ANSWERED)만 조회한다.
  list: (status?: InquiryStatus) =>
    call<Inquiry[]>(() =>
      authApiClient.get('/admin/inquiries', { params: status ? { status } : undefined }),
    ),

  // 문의 상세(관리자는 모든 문의 열람 가능)
  detail: (inquiryId: string) =>
    call<Inquiry>(() => authApiClient.get(`/admin/inquiries/${inquiryId}`)),

  // 답변 등록. 이미 답변한 문의에 다시 보내면 답변이 갱신된다.
  answer: (inquiryId: string, answerContent: string) =>
    call<Inquiry>(() =>
      authApiClient.patch(`/admin/inquiries/${inquiryId}/answer`, { answerContent }),
    ),
}
