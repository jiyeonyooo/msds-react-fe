export type ApiEnvelope<T> = {
  code: string
  message: string
  data: T
}

export type ApiErrorDetail = {
  field: string
  reason: string
  message: string
}

export type ApiErrorData = { errors?: ApiErrorDetail[] } | null
