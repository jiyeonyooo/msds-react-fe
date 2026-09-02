import { useCallback, useState } from 'react'
import { ApiRequestError } from '../../lib/api/errors'
import { reservationApi } from './api'
import type { AvailabilityRequest, AvailableRoom } from './types'

/** 예약 가능 객실 조회의 비동기 상태와 서버 오류를 화면에서 분리한다. */
export function useReservationAvailability() {
  const [rooms, setRooms] = useState<AvailableRoom[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const search = useCallback(async (params: AvailabilityRequest) => {
    setLoading(true)
    setMessage('')
    setErrors({})
    try {
      setRooms((await reservationApi.availability(params)).rooms)
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const fieldErrors = error.errors.reduce<Record<string, string>>(
          (result, item) => ({ ...result, [item.field]: result[item.field] ?? item.message }),
          {},
        )
        setErrors(fieldErrors)
        setMessage(error.errors.length ? '' : error.message)
      } else setMessage('예약 가능 객실을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])
  return { rooms, loading, message, errors, setErrors, setMessage, search }
}
