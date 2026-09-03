import { useEffect, useRef, useState } from 'react'
import { Button, RoomMediaCard, StatusBadge } from '../../components/ui'
import { navigate } from '../../lib/navigation'
import type { AvailabilityRequest } from './types'
import { useReservationAvailability } from './hooks'
import { ReservationSearchBar } from './ReservationSearchBar'
import { defaultAvailability } from './reservationSearchDefaults'

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`

function initialAvailability(): AvailabilityRequest {
  const query = new URLSearchParams(window.location.search)
  return {
    check_in_date: query.get('check_in_date') || defaultAvailability.check_in_date,
    check_out_date: query.get('check_out_date') || '',
    guest_count: Number(query.get('guest_count')) || 2,
  }
}

function shouldSearchFromQuery() {
  const query = new URLSearchParams(window.location.search)
  return (
    query.get('search') === '1' ||
    Boolean(query.get('check_in_date') && query.get('check_out_date'))
  )
}

export function ReservationPage() {
  const [form, setForm] = useState(initialAvailability)
  const searchedFromQuery = useRef(false)
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
    setForm(value)
    setErrors({})
    setMessage('')
    await searchAvailability(value)
  }

  useEffect(() => {
    if (!shouldSearchFromQuery() || searchedFromQuery.current) return
    searchedFromQuery.current = true
    void searchAvailability(initialAvailability())
  }, [searchAvailability])

  return (
    <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] md:pt-[90px]">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">MAKE A RESERVATION</p>
      <h1 className="my-2.5 font-display text-[52px] leading-[0.95] tracking-[-0.125rem] md:text-[62px]">
        예약하기
      </h1>
      <p className="text-sm text-muted">원하시는 머무름의 시간과 인원을 선택해 주세요.</p>
      <ReservationSearchBar
        className="mt-[38px]"
        initialValue={form}
        loading={loading}
        serverErrors={errors}
        onSearch={search}
      />
      {message && (
        <p className="mt-[14px] text-[13px] text-error" role="alert">
          {message}
        </p>
      )}
      {rooms?.length === 0 && (
        <div className="mt-[30px] border border-dashed border-gold-300 px-6 py-[70px] text-center leading-loose text-muted">
          예약 가능한 객실 유형이 없습니다. 다른 날짜를 선택해 주세요.
        </div>
      )}
      {rooms && rooms.length > 0 && (
        <section className="mt-[72px]">
          <div className="mb-7 flex items-end justify-between border-b border-gold-300 max-md:block">
            <div>
              <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">
                AVAILABILITY
              </p>
              <h2 className="my-[22px] font-display text-[34px] leading-[1.15] tracking-[0.3px]">
                {form.check_in_date.replaceAll('-', '.')} —{' '}
                {form.check_out_date.replaceAll('-', '.')}
              </h2>
            </div>
            <p>표시된 금액과 잔여 객실은 서버 기준입니다. 예약 생성 시 다시 확인됩니다.</p>
          </div>
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-3 md:gap-5">
            {rooms.map((room) => (
              <RoomMediaCard
                key={room.room_id}
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
                      onClick={() =>
                        navigate(
                          `/reservations/confirm?room_id=${room.room_id}&check_in_date=${form.check_in_date}&check_out_date=${form.check_out_date}&guest_count=${form.guest_count}`,
                        )
                      }
                    >
                      이 객실 예약
                    </Button>
                  </>
                }
              >
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
            ))}
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
