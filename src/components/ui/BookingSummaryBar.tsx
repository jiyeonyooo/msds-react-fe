import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  bookingToQuery,
  formatStayLabel,
  isSearchable,
  useBooking,
  withFallbackCheckOut,
} from '../../features/reservation/bookingStore'

// 예약 조건을 직접 편집하는 화면에서는 같은 정보를 두 번 보여 줄 이유가 없다.
const hiddenPrefixes = ['/reservations', '/admin', '/login', '/signup', '/__dev']

/**
 * 히어로를 벗어나면 따라붙는 예약 조건 요약 캡슐.
 *
 * 날짜와 인원을 화면마다 다시 입력하게 만들던 흐름을 끊는 자리다. 조건을 들고 다니되
 * 시선을 뺏지 않도록, 헤더 바로 아래에서 아주 느리게 내려온다. 숨어 있는 동안 본문을
 * 밀어내지 않도록 껍데기는 높이 0으로 두고 캡슐만 그 위에 띄운다.
 */
export function BookingSummaryBar() {
  const booking = useBooking()
  const { pathname } = useLocation()
  const [passedHero, setPassedHero] = useState(false)

  useEffect(() => {
    const update = () => setPassedHero(scrollY > 520)
    update()
    addEventListener('scroll', update, { passive: true })
    return () => removeEventListener('scroll', update)
  }, [])

  const hidden = hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))
  // 아직 아무것도 고르지 않은 사용자에게 굳이 빈 요약을 띄우지 않는다.
  const hasIntent = isSearchable(booking) || booking.room_id !== null
  const visible = passedHero && hasIntent && !hidden
  const query = bookingToQuery(withFallbackCheckOut(booking), { search: '1' })

  return (
    <div
      aria-hidden={!visible}
      className={`sticky top-[92px] z-30 hidden h-0 transition duration-500 ease-calm md:block ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'
      }`}
    >
      <div className="mx-auto mt-3 flex w-[min(1240px,calc(100%_-_64px))] items-center justify-between gap-6 rounded-full border border-border-accent bg-surface/95 px-7 py-3 shadow-floating backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-5">
          <span className="text-[10px] font-medium tracking-[0.16em] text-gold-500">YOUR STAY</span>
          <strong className="truncate text-xs font-medium text-navy-900">
            {formatStayLabel(booking)}
          </strong>
          <span className="text-xs text-muted">성인 {booking.guest_count}명</span>
          {booking.room_id !== null && (
            <Link
              className="truncate text-xs text-gold-500 underline underline-offset-4 hover:text-navy-900"
              to={`/rooms/${booking.room_id}`}
            >
              선택한 객실 보기
            </Link>
          )}
        </div>
        <Link
          className="shrink-0 rounded-sm bg-navy-900 px-5 py-2.5 text-[11px] font-medium tracking-[0.06em] text-white transition hover:bg-navy-700"
          tabIndex={visible ? 0 : -1}
          to={`/reservations?${query}`}
        >
          {isSearchable(booking) ? '예약 이어서 하기' : '날짜 정하고 예약'}
        </Link>
      </div>
    </div>
  )
}
