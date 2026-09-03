import { authApiClient } from '../../../lib/apiClient'
import { call } from '../../../lib/apiError'
import type { AxiosResponse } from 'axios'
import type { ApiEnvelope, InquiryResponse, InquiryStatus } from './types'

async function request<T>(run: () => Promise<AxiosResponse<ApiEnvelope<T>>>) {
  return (await call(run)).data
}

export const getAdminInquiries = (status?: InquiryStatus) =>
  request(() =>
    authApiClient.get<ApiEnvelope<InquiryResponse[]>>(
      `/admin/inquiries${status ? `?status=${status}` : ''}`,
    ),
  )

export const getAdminInquiry = (inquiryId: number) =>
  request(() => authApiClient.get<ApiEnvelope<InquiryResponse>>(`/admin/inquiries/${inquiryId}`))

export const answerAdminInquiry = (inquiryId: number, answerContent: string) =>
  request(() =>
    authApiClient.patch<ApiEnvelope<InquiryResponse>>(`/admin/inquiries/${inquiryId}/answer`, {
      answerContent,
    }),
  )
