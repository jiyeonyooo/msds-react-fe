import { authApiClient } from '../../../lib/apiClient'
import { call } from '../../../lib/apiError'
import type { AdminWellnessStatistics } from './types'

export const adminWellnessApi = {
  async statistics(params: { fromDate?: string; toDate?: string } = {}) {
    return (
      await call<AdminWellnessStatistics>(() =>
        authApiClient.get('/admin/wellness/statistics', { params }),
      )
    ).data
  },
}
