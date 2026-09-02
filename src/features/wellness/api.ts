import axios from 'axios'
import { getDevScenario, isDevMode } from '../../dev/scenarios'
import { authApiClient, publicApiClient } from '../../lib/apiClient'
import type {
  ApiEnvelope,
  HourlyQuietness,
  QuietnessHistoryPoint,
  QuietnessSummary,
  QuietSpaceRecommendation,
  SpaceQuietness,
  WellnessCheckDetail,
  WellnessCheckRequest,
  WellnessCheckResult,
  WellnessHistory,
  WellnessQuestion,
  WellnessTrendPoint,
} from './types'
import {
  demoDetail,
  demoHistory,
  demoHourly,
  demoQuestions,
  demoQuietnessSummary,
  demoResult,
  demoSpaces,
  demoTrend,
} from './wellnessDemo'

export class WellnessApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'WellnessApiError'
    this.status = status
    this.code = code
  }
}

async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T>; status: number }>): Promise<T> {
  try {
    const response = await request
    if (!response.data || typeof response.data !== 'object' || !('data' in response.data)) {
      throw new WellnessApiError(
        response.status,
        'API_INVALID_RESPONSE',
        '서버 응답을 확인할 수 없습니다.',
      )
    }
    return response.data.data
  } catch (error) {
    if (error instanceof WellnessApiError) throw error
    if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
      throw new WellnessApiError(
        error.response?.status ?? 0,
        error.response?.data?.code ?? 'API_NETWORK_ERROR',
        error.response?.data?.message ?? 'API 서버에 연결할 수 없습니다.',
      )
    }
    throw error
  }
}

export const wellnessApi = {
  questions: () =>
    dev(demoQuestions, () =>
      unwrap(publicApiClient.get<ApiEnvelope<WellnessQuestion[]>>('/wellness/questions')),
    ),
  submitGuest: (data: WellnessCheckRequest) =>
    dev({ ...demoResult, checkId: null, saved: false }, () =>
      unwrap(
        publicApiClient.post<ApiEnvelope<WellnessCheckResult>>('/wellness/guest/checks', data),
      ),
    ),
  submitMember: (data: WellnessCheckRequest) =>
    dev(demoResult, () =>
      unwrap(authApiClient.post<ApiEnvelope<WellnessCheckResult>>('/wellness/checks', data)),
    ),
  history: () =>
    dev(demoHistory, () =>
      unwrap(authApiClient.get<ApiEnvelope<WellnessHistory[]>>('/wellness/checks/me')),
    ),
  detail: (checkId: number) =>
    dev({ ...demoDetail, checkId }, () =>
      unwrap(authApiClient.get<ApiEnvelope<WellnessCheckDetail>>(`/wellness/checks/me/${checkId}`)),
    ),
  trend: () =>
    dev(demoTrend, () =>
      unwrap(authApiClient.get<ApiEnvelope<WellnessTrendPoint[]>>('/wellness/trends/me')),
    ),
}

const defaultGuesthouseId = Number(import.meta.env.VITE_DEFAULT_GUESTHOUSE_ID || 1)

export const quietnessApi = {
  defaultGuesthouseId,
  summary: (guesthouseId = defaultGuesthouseId) =>
    dev({ ...demoQuietnessSummary, guesthouseId }, () =>
      unwrap(
        publicApiClient.get<ApiEnvelope<QuietnessSummary>>(
          `/quietness/guesthouses/${guesthouseId}/summary`,
        ),
      ),
    ),
  spaces: (guesthouseId = defaultGuesthouseId) =>
    dev(demoSpaces, () =>
      unwrap(
        publicApiClient.get<ApiEnvelope<SpaceQuietness[]>>(
          `/quietness/guesthouses/${guesthouseId}/spaces`,
        ),
      ),
    ),
  current: (spaceId: number, guesthouseId = defaultGuesthouseId) =>
    dev(demoSpaces.find((space) => space.spaceId === spaceId) ?? demoSpaces[0], () =>
      unwrap(
        publicApiClient.get<ApiEnvelope<SpaceQuietness>>(
          `/quietness/guesthouses/${guesthouseId}/spaces/${spaceId}`,
        ),
      ),
    ),
  history: (spaceId: number, from: string, to: string) =>
    dev(
      demoHourly.map((item): QuietnessHistoryPoint => ({
        decibel: item.averageDecibel,
        measuredAt: item.hourStart,
      })),
      () =>
        unwrap(
          publicApiClient.get<ApiEnvelope<QuietnessHistoryPoint[]>>(
            `/quietness/spaces/${spaceId}/history`,
            { params: { from, to } },
          ),
        ),
    ),
  recommendation: (guesthouseId = defaultGuesthouseId) =>
    unwrap(
      authApiClient.get<ApiEnvelope<QuietSpaceRecommendation>>(
        `/quietness/guesthouses/${guesthouseId}/recommendation`,
      ),
    ),
  hourly: (spaceId: number, from: string, to: string, guesthouseId = defaultGuesthouseId) =>
    dev(demoHourly, () =>
      unwrap(
        publicApiClient.get<ApiEnvelope<HourlyQuietness[]>>(
          `/quietness/guesthouses/${guesthouseId}/spaces/${spaceId}/hourly`,
          { params: { from, to } },
        ),
      ),
    ),
}

function dev<T>(demoData: T, liveRequest: () => Promise<T>): Promise<T> {
  if (!isDevMode) return liveRequest()
  const scenario = getDevScenario()
  if (scenario === 'demo') return Promise.resolve(demoData)
  if (scenario === 'empty' && Array.isArray(demoData)) return Promise.resolve([] as T)
  if (scenario === 'loading')
    return new Promise((resolve, reject) =>
      setTimeout(() => liveRequest().then(resolve, reject), 1500),
    )
  return liveRequest()
}
