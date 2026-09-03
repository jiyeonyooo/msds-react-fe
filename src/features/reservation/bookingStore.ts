import { useSyncExternalStore } from 'react'
import type { AvailabilityRequest } from './types'
import { seoulToday } from './reservationSearchDefaults'

/**
 * 예약 컨텍스트(날짜·인원·선택 객실)를 한 곳에 묶어 두는 세션 저장소.
 *
 * 이 값이 없던 동안 히어로 검색 바, 객실 목록, 예약 화면이 각자 다른 기본값을 들고 있었고
 * 객실 상세에서 넘어온 room_id 는 예약 화면에서 그대로 버려졌다. 같은 사용자가 같은 날짜를
 * 세 번 입력하게 만드는 자리라, 화면 상태가 아니라 세션 상태로 끌어올린다.
 */
export type BookingContext = AvailabilityRequest & { room_id: number | null }

const storageKey = 'msds-booking'
const changeEvent = 'msds-booking-changed'

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

export const addDays = (isoDate: string, amount: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

export const nightsBetween = (checkIn: string, checkOut: string) => {
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return 0
  const from = Date.parse(`${checkIn}T00:00:00Z`)
  const to = Date.parse(`${checkOut}T00:00:00Z`)
  return Math.max(0, Math.round((to - from) / 86_400_000))
}

function emptyContext(): BookingContext {
  return { check_in_date: seoulToday(), check_out_date: '', guest_count: 2, room_id: null }
}

function normalize(value: Partial<BookingContext> | null): BookingContext {
  const base = emptyContext()
  if (!value) return base
  const checkIn = isIsoDate(value.check_in_date) ? value.check_in_date : base.check_in_date
  // 지난 날짜가 세션에 남아 있으면 조회 자체가 실패하므로 오늘로 끌어올린다.
  const safeCheckIn = checkIn < base.check_in_date ? base.check_in_date : checkIn
  const checkOut =
    isIsoDate(value.check_out_date) && value.check_out_date > safeCheckIn
      ? value.check_out_date
      : ''
  const guests = Number(value.guest_count)
  const roomId = Number(value.room_id)
  return {
    check_in_date: safeCheckIn,
    check_out_date: checkOut,
    guest_count: Number.isInteger(guests) && guests >= 1 && guests <= 4 ? guests : base.guest_count,
    room_id: Number.isInteger(roomId) && roomId >= 1 ? roomId : null,
  }
}

function readStorage(): BookingContext {
  try {
    const raw = sessionStorage.getItem(storageKey)
    return normalize(raw ? (JSON.parse(raw) as Partial<BookingContext>) : null)
  } catch {
    return emptyContext()
  }
}

let current = readStorage()

const isSame = (a: BookingContext, b: BookingContext) =>
  a.check_in_date === b.check_in_date &&
  a.check_out_date === b.check_out_date &&
  a.guest_count === b.guest_count &&
  a.room_id === b.room_id

export function getBooking() {
  return current
}

/** 부분 갱신. 값이 실제로 달라졌을 때만 구독자를 깨운다. */
export function setBooking(patch: Partial<BookingContext>) {
  const next = normalize({ ...current, ...patch })
  if (isSame(current, next)) return current
  current = next
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(next))
  } catch {
    // 저장이 막힌 브라우저에서도 현재 세션의 흐름은 그대로 이어져야 한다.
  }
  dispatchEvent(new Event(changeEvent))
  return next
}

export function clearSelectedRoom() {
  setBooking({ room_id: null })
}

/** 조회 가능한 조건인지. 체크아웃이 비어 있으면 아직 아니다. */
export function isSearchable(booking: BookingContext) {
  return Boolean(booking.check_out_date) && booking.check_out_date > booking.check_in_date
}

/** 체크아웃이 비면 1박으로 채운다. 객실 상세에서 날짜 없이 넘어온 경우를 살린다. */
export function withFallbackCheckOut(booking: BookingContext): BookingContext {
  if (isSearchable(booking)) return booking
  return { ...booking, check_out_date: addDays(booking.check_in_date, 1) }
}

export function bookingToQuery(booking: BookingContext, extra: Record<string, string> = {}) {
  const query = new URLSearchParams({
    check_in_date: booking.check_in_date,
    check_out_date: booking.check_out_date,
    guest_count: String(booking.guest_count),
    ...extra,
  })
  if (booking.room_id) query.set('room_id', String(booking.room_id))
  return query.toString()
}

/** URL 쿼리에 담겨 온 예약 조건을 저장소로 흡수한다. 링크 공유·새로고침 복구용. */
export function readBookingFromQuery(search: string): Partial<BookingContext> {
  const query = new URLSearchParams(search)
  const patch: Partial<BookingContext> = {}
  const checkIn = query.get('check_in_date')
  const checkOut = query.get('check_out_date')
  const guests = query.get('guest_count')
  const roomId = query.get('room_id')
  if (isIsoDate(checkIn)) patch.check_in_date = checkIn
  if (isIsoDate(checkOut)) patch.check_out_date = checkOut
  if (guests) patch.guest_count = Number(guests)
  if (roomId) patch.room_id = Number(roomId)
  return patch
}

function subscribe(listener: () => void) {
  addEventListener(changeEvent, listener)
  return () => removeEventListener(changeEvent, listener)
}

export function useBooking() {
  return useSyncExternalStore(subscribe, getBooking, getBooking)
}

const dateLabel = new Intl.DateTimeFormat('ko-KR', {
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  timeZone: 'UTC',
})

export function formatStayLabel(booking: BookingContext) {
  const checkIn = dateLabel.format(new Date(`${booking.check_in_date}T00:00:00Z`))
  if (!isSearchable(booking)) return `${checkIn} · 체크아웃 미정`
  const checkOut = dateLabel.format(new Date(`${booking.check_out_date}T00:00:00Z`))
  return `${checkIn} — ${checkOut} · ${nightsBetween(booking.check_in_date, booking.check_out_date)}박`
}
