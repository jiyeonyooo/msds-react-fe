export type InquiryStatus = 'WAITING' | 'ANSWERED'

export interface InquiryResponse {
  inquiryId: number
  authorEmail: string
  title: string
  content: string
  status: InquiryStatus
  answerContent: string | null
  answeredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiEnvelope<T> {
  code: string
  message: string
  data: T
}
