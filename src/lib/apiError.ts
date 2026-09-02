import axios, { type AxiosResponse } from 'axios'

/**
 * 백엔드 공통 응답 규격 ApiResponse(code, message, data)와 그 실패 응답을 다루는 공용 타입.
 * HTTP 호출 자체는 lib/apiClient의 axios 인스턴스가 담당하고, 여기서는 응답을 화면이 쓰기 좋은
 * 형태(ApiError, 필드별 에러)로 정리한다.
 */
export type ApiEnvelope<T> = { code: string; message: string; data: T }
export type FieldErrors = Partial<Record<string, string>>
export type ApiErrorDetail = { field: string; reason: string; message: string }

export class ApiError extends Error {
  status: number
  code: string
  fieldErrors: FieldErrors
  errors: ApiErrorDetail[]
  constructor(status: number, code: string, message: string, fieldErrors: FieldErrors = {}, errors: ApiErrorDetail[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.errors = errors
  }
}

/**
 * 400(INVALID_INPUT) 응답의 메시지를 필드별 에러로 되돌린다.
 * 서버는 "email: 올바른 이메일 형식이 아닙니다., password: 비밀번호는 필수 입력값입니다."처럼
 * "필드명: 메시지"를 쉼표로 이어 붙여 내려주므로, 필드명 위치를 기준으로 잘라낸다.
 */
const requestFields = ['email', 'password', 'name', 'phoneNumber', 'title', 'content'] as const

export function parseFieldErrors(message: string): FieldErrors {
  const marker = new RegExp(`(?:^|,\\s*)(${requestFields.join('|')}):\\s*`, 'g')
  const markers = [...message.matchAll(marker)]
  const errors: FieldErrors = {}
  markers.forEach((match, index) => {
    const start = match.index + match[0].length
    const end = index + 1 < markers.length ? markers[index + 1].index : message.length
    const text = message.slice(start, end).trim()
    if (text) errors[match[1]] = text
  })
  return errors
}

// axios 오류를 화면이 그대로 쓸 수 있는 ApiError로 변환한다.
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const body = error.response?.data
    if (!error.response)
      return new ApiError(
        0,
        'NETWORK_ERROR',
        'API 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.',
      )
    if (!body || typeof body !== 'object' || !('message' in body))
      return new ApiError(
        error.response.status,
        'API_INVALID_RESPONSE',
        'API 서버 응답을 확인할 수 없습니다. 백엔드 연결 상태를 확인해 주세요.',
      )
    const errors = body.data && typeof body.data === 'object' && !Array.isArray(body.data)
      && 'errors' in body.data
      ? body.data.errors
      : []
    return new ApiError(
      error.response.status,
      body.code,
      body.message,
      body.code === 'INVALID_INPUT' ? parseFieldErrors(body.message) : {},
      Array.isArray(errors) ? errors.filter(isApiErrorDetail) : [],
    )
  }
  return new ApiError(0, 'UNKNOWN_ERROR', '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
}

function isApiErrorDetail(value: unknown): value is ApiErrorDetail {
  return Boolean(value && typeof value === 'object' && 'field' in value && 'reason' in value && 'message' in value)
}

// ApiResponse 봉투에서 data만 꺼낸다. 규격이 아니면 ApiError로 바꿔 던진다.
export function unwrap<T>(body: ApiEnvelope<T> | undefined, status: number): ApiEnvelope<T> {
  if (!body || typeof body !== 'object' || !('data' in body))
    throw new ApiError(
      status,
      'API_INVALID_RESPONSE',
      'API 서버 응답을 확인할 수 없습니다. 백엔드 연결 상태를 확인해 주세요.',
    )
  return body
}

/**
 * axios 호출을 감싸 ApiResponse 봉투를 확인하고, 실패는 ApiError로 통일한다.
 * 화면은 항상 { code, message, data } 형태를 돌려받는다.
 */
export async function call<T>(
  run: () => Promise<AxiosResponse<ApiEnvelope<T>>>,
): Promise<ApiEnvelope<T>> {
  try {
    const response = await run()
    return unwrap<T>(response.data, response.status)
  } catch (error) {
    throw toApiError(error)
  }
}
