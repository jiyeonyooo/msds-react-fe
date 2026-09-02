// 문의 도메인 타입. 백엔드 계약(member.inquiry.dto)과 1:1로 맞춘다.
export type InquiryStatus = 'WAITING' | 'ANSWERED'

export type Inquiry = {
  inquiryId: number
  authorEmail: string
  title: string
  content: string
  status: InquiryStatus
  answerContent: string | null // 답변 전이면 null
  answeredAt: string | null
  createdAt: string
  updatedAt: string
}

export type InquiryCreateRequest = { title: string; content: string }
