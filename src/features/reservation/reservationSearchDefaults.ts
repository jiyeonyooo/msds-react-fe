import type { AvailabilityRequest } from './types'

export const seoulToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())

export const defaultAvailability: AvailabilityRequest = {
  check_in_date: seoulToday(),
  check_out_date: '',
  guest_count: 2,
}
