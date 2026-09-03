import { type FormEvent, useState } from 'react'
import { BookingField, Button, DatePicker, Select } from '../../components/ui'
import type { AvailabilityRequest } from './types'
import { seoulToday } from './reservationSearchDefaults'
import { nightsBetween, setBooking, useBooking } from './bookingStore'

type ReservationSearchBarProps = {
  className?: string
  loading?: boolean
  serverErrors?: Record<string, string>
  onSearch: (value: AvailabilityRequest) => void | Promise<void>
}

/**
 * 예약 조건 입력 바. 값은 화면이 아니라 예약 컨텍스트에 바로 쓰인다.
 * 히어로에서 채운 날짜가 객실·예약 화면까지 그대로 따라가야 하기 때문이다.
 */
export function ReservationSearchBar({
  className = '',
  loading = false,
  onSearch,
  serverErrors = {},
}: ReservationSearchBarProps) {
  const booking = useBooking()
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const errors = { ...serverErrors, ...clientErrors }
  const nights = nightsBetween(booking.check_in_date, booking.check_out_date)

  const update = <K extends keyof AvailabilityRequest>(key: K, value: AvailabilityRequest[K]) => {
    setBooking({ [key]: value })
    setClientErrors((current) => ({ ...current, [key]: '' }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (booking.check_in_date < seoulToday())
      next.check_in_date = '체크인은 오늘 또는 이후 날짜를 선택해 주세요.'
    if (!booking.check_out_date || booking.check_out_date <= booking.check_in_date)
      next.check_out_date = '체크아웃은 체크인 이후 날짜여야 합니다.'
    if (booking.guest_count < 1) next.guest_count = '투숙 인원은 1명 이상이어야 합니다.'
    setClientErrors(next)
    if (Object.keys(next).length) return
    void onSearch({
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      guest_count: booking.guest_count,
    })
  }

  return (
    <form
      className={`grid grid-cols-1 gap-3 border border-border-subtle bg-white p-[26px] md:grid-cols-[repeat(3,minmax(0,1fr))_auto] ${className}`}
      onSubmit={submit}
      noValidate
    >
      <SearchField label="CHECK-IN" error={errors.check_in_date}>
        <DatePicker
          aria-invalid={Boolean(errors.check_in_date)}
          label="체크인"
          min={seoulToday()}
          onChange={(value) => update('check_in_date', value)}
          value={booking.check_in_date}
        />
      </SearchField>
      <SearchField
        label={nights > 0 ? `CHECK-OUT · ${nights}박` : 'CHECK-OUT'}
        error={errors.check_out_date}
      >
        <DatePicker
          aria-invalid={Boolean(errors.check_out_date)}
          label="체크아웃"
          min={booking.check_in_date}
          onChange={(value) => update('check_out_date', value)}
          value={booking.check_out_date}
        />
      </SearchField>
      <SearchField label="GUESTS" error={errors.guest_count}>
        <Select
          aria-invalid={Boolean(errors.guest_count)}
          className="h-8 w-full border-0 bg-transparent px-0 text-sm"
          value={booking.guest_count}
          onValueChange={(value) => update('guest_count', Number(value))}
        >
          {[1, 2, 3, 4].map((count) => (
            <option key={count} value={count}>
              성인 {count}명
            </option>
          ))}
        </Select>
      </SearchField>
      <Button type="submit" disabled={loading}>
        {loading ? '조회 중…' : '예약 가능 객실 보기'}
      </Button>
    </form>
  )
}

function SearchField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <BookingField label={label}>{children}</BookingField>
      {error && (
        <p className="mt-1 mb-0 text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
