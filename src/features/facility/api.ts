import axios from 'axios'
import { publicApiClient } from '../../lib/apiClient'
import { uniqueBy } from '../../lib/collections'
import type { Facility, FacilityCategory, FacilityListResponse } from './types'

export class FacilityApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function getFacilities(category?: FacilityCategory): Promise<Facility[]> {
  try {
    const response = await publicApiClient.get<FacilityListResponse>('/facilities', {
      params: category ? { category } : undefined,
    })
    if (!response.data || !Array.isArray(response.data.data)) {
      throw new FacilityApiError(response.status, 'API_INVALID_RESPONSE', '편의시설 정보를 확인할 수 없습니다.')
    }
    return uniqueBy(response.data.data, (facility) => facility.facilityId)
  } catch (error) {
    if (error instanceof FacilityApiError) throw error
    if (axios.isAxiosError<FacilityListResponse>(error)) {
      throw new FacilityApiError(
        error.response?.status ?? 0,
        error.response?.data?.code ?? 'NETWORK_ERROR',
        '편의시설 정보를 불러오지 못했습니다.',
      )
    }
    throw new FacilityApiError(0, 'UNKNOWN_ERROR', '편의시설 정보를 불러오지 못했습니다.')
  }
}
