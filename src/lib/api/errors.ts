import type { ApiErrorDetail } from './types'

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string
  readonly errors: ApiErrorDetail[]

  constructor(status: number, code: string, message: string, errors: ApiErrorDetail[] = []) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.errors = errors
  }
}
