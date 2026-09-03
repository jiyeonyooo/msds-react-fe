import { apiClient } from '../../program/client'
import type { ApiEnvelope, InquiryResponse, InquiryStatus } from './types'

async function unwrap<T>(request: Promise<ApiEnvelope<T>>) {
  return (await request).data
}

export const getAdminInquiries = (status?: InquiryStatus) =>
  unwrap(
    apiClient.get<ApiEnvelope<InquiryResponse[]>>(
      `/api/admin/inquiries${status ? `?status=${status}` : ''}`,
    ),
  )

export const getAdminInquiry = (inquiryId: number) =>
  unwrap(apiClient.get<ApiEnvelope<InquiryResponse>>(`/api/admin/inquiries/${inquiryId}`))

export const answerAdminInquiry = (inquiryId: number, answerContent: string) =>
  unwrap(
    apiClient.patch<ApiEnvelope<InquiryResponse>>(`/api/admin/inquiries/${inquiryId}/answer`, {
      answerContent,
    }),
  )
