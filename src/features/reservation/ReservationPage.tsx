import { useEffect, useMemo, useRef } from 'react'
import { Button, RoomMediaCard, StatusBadge } from '../../components/ui'
import { SkeletonCards } from '../../components/motion'
import { navigate } from '../../lib/navigation'
import type { AvailabilityRequest } from './types'
import { useReservationAvailability } from './hooks'
import { ReservationSearchBar } from './ReservationSearchBar'
import {
  bookingToQuery,
  getBooking,
  isSearchable,
  nightsBetween,
  readBookingFromQuery,
  setBooking,
  useBooking,
  withFallbackCheckOut,
} from './bookingStore'

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`

export function ReservationPage() {
  const booking = useBooking()
  const searchedOnce = useRef(false)
  const selectedCard = useRef<HTMLDivElement>(null)
  // 하이라이트는 별도 상태가 아니라 예약 컨텍스트에서 그대로 파생시킨다.
  const highlightedRoomId = booking.room_id
  const {
    rooms,
    errors,
    loading,
    message,
    setErrors,
    setMessage,
    search: searchAvailability,
  } = useReservationAvailability()

  async function search(value: AvailabilityRequest) {
    setBooking(value)
    setErrors({})
    setMessage('')
    await searchAvailability(value)
  }

  // 객실 상세에서 "CHECK AVAILABILITY"로 넘어오면 room_id 만 있고 날짜가 없을 수 있다.
  // 그동안은 빈 검색 폼만 뜨면서 방금 고른 객실이 사라졌으므로, 1박을 채워 바로 조회한다.
  useEffect(() => {
    if (searchedOnce.current) return
    const fromQuery = readBookingFromQuery(window.location.search)
    const next = withFallbackCheckOut(setBooking(fromQuery))
    const query = new URLSearchParams(window.location.search)
    const wantsSearch =
      query.get('search') === '1' || query.has('room_id') || Boolean(query.get('check_out_date'))
    if (!wantsSearch && !isSearchable(getBooking())) return
    searchedOnce.current = true
    setBooking(next)
    void searchAvailability({
      check_in_date: next.check_in_date,
      check_out_date: next.check_out_date,
      guest_count: next.guest_count,
    })
  }, [searchAvailability])

  // 고른 객실이 목록 아래쪽에 있으면 눈으로 찾게 만들지 않는다.
  useEffect(() => {
    if (!rooms || highlightedRoomId === null || !selectedCard.current) return
    selectedCard.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightedRoomId, rooms])

  const nights = nightsBetween(booking.check_in_date, booking.check_out_date)
  const orderedRooms = useMemo(() => {
    if (!rooms || highlightedRoomId === null) return rooms
    // 고른 객실을 맨 앞으로. 조회 결과가 바뀌어도 사용자의 선택이 먼저 보여야 한다.
    return [...rooms].sort((a, b) =>
      a.room_id === highlightedRoomId ? -1 : b.room_id === highlightedRoomId ? 1 : 0,
    )
  }, [highlightedRoomId, rooms])

  return (
    <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] md:pt-[90px]">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">MAKE A RESERVATION</p>
      <h1 className="my-2.5 font-display text-[52px] leading-[0.95] tracking-[-0.125rem] md:text-[62px]">
        예약하기
      </h1>
      <p className="text-sm text-muted">원하시는 머무름의 시간과 인원을 선택해 주세요.</p>
      <ReservationSearchBar
        className="mt-[38px]"
        loading={loading}
        serverErrors={errors}
        onSearch={search}
      />
      {message && (
        <p className="mt-[14px] text-[13px] text-error" role="alert">
          {message}
        </p>
      )}
      {loading && (
        <section className="mt-[72px]">
          <SkeletonCards
            className="grid grid-cols-1 gap-[14px] md:grid-cols-3 md:gap-5"
            count={3}
            mediaClassName="h-[210px] md:h-[310px]"
          />
        </section>
      )}
      {!loading && rooms?.length === 0 && (
        <div className="mt-[30px] border border-dashed border-gold-300 px-6 py-[70px] text-center leading-loose text-muted">
          예약 가능한 객실 유형이 없습니다. 다른 날짜를 선택해 주세요.
        </div>
      )}
      {!loading && orderedRooms && orderedRooms.length > 0 && (
        <section className="mt-[72px]">
          <div className="mb-7 flex items-end justify-between border-b border-gold-300 max-md:block">
            <div>
              <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">
                AVAILABILITY
              </p>
              <h2 className="my-[22px] font-display text-[34px] leading-[1.15] tracking-[0.3px]">
                {booking.check_in_date.replaceAll('-', '.')} —{' '}
                {booking.check_out_date.replaceAll('-', '.')}
                {nights > 0 && (
                  <span className="ml-3 font-sans text-sm text-muted">{nights}박</span>
                )}
              </h2>
            </div>
            <p>표시된 금액과 잔여 객실은 서버 기준입니다. 예약 생성 시 다시 확인됩니다.</p>
          </div>
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-3 md:gap-5">
            {orderedRooms.map((room) => {
              const selected = room.room_id === highlightedRoomId
              return (
                <div
                  className={`rounded-lg transition duration-500 ease-calm ${
                    selected ? 'ring-2 ring-gold-500 ring-offset-4 ring-offset-canvas' : ''
                  }`}
                  key={room.room_id}
                  ref={selected ? selectedCard : undefined}
                >
                  <RoomMediaCard
                    name={room.room_name}
                    description={room.description ?? '고요한 휴식을 위한 객실입니다.'}
                    imageUrl={room.image_url}
                    badge={<StatusBadge available={room.available} />}
                    footer={
                      <>
                        <small className="text-[11px] text-muted">
                          남은 객실 {room.remaining_count}개
                        </small>
                        <Button
                          disabled={!room.available}
                          onClick={() => {
                            const next = setBooking({ room_id: room.room_id })
                            navigate(`/reservations/confirm?${bookingToQuery(next)}`)
                          }}
                        >
                          이 객실 예약
                        </Button>
                      </>
                    }
                  >
                    {selected && (
                      <p className="mb-3 text-[11px] font-medium tracking-[0.12em] text-gold-500">
                        방금 보신 객실입니다
                      </p>
                    )}
                    <dl className="grid grid-cols-2 gap-2.5 border-t border-[#eee9e0] pt-4 text-xs [&_dd]:m-0 [&_dd]:text-right [&_dt]:text-muted">
                      <dt>최대 인원</dt>
                      <dd>{room.max_guest_count}명</dd>
                      <dt>숙박 일수</dt>
                      <dd>{room.nights}박</dd>
                      <dt>1박 기준가</dt>
                      <dd>{won(room.base_price)}</dd>
                      <dt>총 예약 금액</dt>
                      <dd className="m-0 text-right text-gold-500">{won(room.total_price)}</dd>
                    </dl>
                  </RoomMediaCard>
                </div>
              )
            })}
          </div>
        </section>
      )}
      {!loading && !message && rooms === null && (
        <p className="my-[45px] text-sm text-muted">
          날짜와 인원을 입력하면 예약 가능한 객실 유형을 안내합니다.
        </p>
      )}
    </main>
  )
}
