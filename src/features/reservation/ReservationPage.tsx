import { type FormEvent, useState } from 'react'
import { navigate } from '../../lib/navigation'
import { ApiError, reservationApi } from './api'
import type { AvailableRoom } from './types'
const won = (value: number) => `${value.toLocaleString('ko-KR')}원`
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
export function ReservationPage() {
  const [form, setForm] = useState({ check_in_date: today, check_out_date: '', guest_count: 2 })
  const [rooms, setRooms] = useState<AvailableRoom[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function search(e: FormEvent) {
    e.preventDefault()
    if (form.check_in_date < today) return setError('체크인은 오늘 또는 이후 날짜를 선택해 주세요.')
    if (!form.check_out_date || form.check_out_date <= form.check_in_date)
      return setError('체크아웃은 체크인 이후 날짜여야 합니다.')
    setLoading(true)
    setError('')
    try {
      setRooms(await reservationApi.availability(form))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '예약 가능 객실을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] md:pt-[90px]">
      <p className="text-[11px] font-medium tracking-[0.17em] text-msds-gold">MAKE A RESERVATION</p>
      <h1 className="my-2.5 font-display text-[52px] leading-[0.95] tracking-[-0.125rem] md:text-[62px]">
        예약하기
      </h1>
      <p className="text-sm text-msds-muted">원하시는 머무름의 시간과 인원을 선택해 주세요.</p>
      <form
        className="mt-[38px] grid grid-cols-1 gap-3 border border-msds-border bg-white p-[26px] md:grid-cols-[1fr_1fr_1fr_auto]"
        onSubmit={search}
      >
        <label className="grid gap-[5px] border border-msds-border px-4 py-3 text-[10px] tracking-[0.12em] text-msds-muted">
          CHECK-IN
          <input
            className="min-w-0 border-0 bg-transparent text-sm text-msds-navy"
            type="date"
            min={today}
            value={form.check_in_date}
            onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
          />
        </label>
        <label className="grid gap-[5px] border border-msds-border px-4 py-3 text-[10px] tracking-[0.12em] text-msds-muted">
          CHECK-OUT
          <input
            className="min-w-0 border-0 bg-transparent text-sm text-msds-navy"
            type="date"
            min={form.check_in_date}
            value={form.check_out_date}
            onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
          />
        </label>
        <label className="grid gap-[5px] border border-msds-border px-4 py-3 text-[10px] tracking-[0.12em] text-msds-muted">
          GUESTS
          <select
            className="min-w-0 border-0 bg-transparent text-sm text-msds-navy"
            value={form.guest_count}
            onChange={(e) => setForm({ ...form, guest_count: Number(e.target.value) })}
          >
            {[1, 2, 3, 4].map((x) => (
              <option key={x} value={x}>
                성인 {x}명
              </option>
            ))}
          </select>
        </label>
        <button
          className="rounded-msds bg-msds-navy px-6 py-[13px] text-xs tracking-[0.06em] text-white transition hover:bg-msds-navy-light disabled:cursor-not-allowed disabled:bg-[#bdbbb6]"
          disabled={loading}
        >
          {loading ? '조회 중…' : '예약 가능 객실 보기'}
        </button>
      </form>
      {error && (
        <p className="mt-[14px] text-[13px] text-msds-error" role="alert">
          {error}
        </p>
      )}
      {rooms?.length === 0 && (
        <div className="mt-[30px] border border-dashed border-msds-gold-light px-6 py-[70px] text-center leading-loose text-msds-muted">
          예약 가능한 객실 유형이 없습니다. 다른 날짜를 선택해 주세요.
        </div>
      )}
      {rooms && rooms.length > 0 && (
        <section className="mt-[72px]">
          <div className="mb-7 flex items-end justify-between border-b border-msds-gold-light max-md:block">
            <div>
              <p className="text-[11px] font-medium tracking-[0.17em] text-msds-gold">
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
              <article className="border border-msds-border bg-white" key={room.room_id}>
                <div
                  className="h-[180px] bg-[linear-gradient(135deg,#d4c29c,#f1ece3_45%,#355069)] bg-cover bg-center"
                  style={room.image_url ? { backgroundImage: `url(${room.image_url})` } : undefined}
                />
                <div className="p-[26px]">
                  <span
                    className={`float-right border px-[7px] py-1 text-[11px] ${room.available ? 'border-msds-gold-light text-[#a6874f]' : 'border-msds-border text-[#8f969b]'}`}
                  >
                    {room.available ? '예약 가능' : '예약 마감'}
                  </span>
                  <h3 className="my-3 font-display text-[29px] font-medium">{room.room_name}</h3>
                  <p className="min-h-[34px] text-xs text-msds-muted">
                    {room.description ?? '고요한 휴식을 위한 객실입니다.'}
                  </p>
                  <dl className="grid grid-cols-2 gap-2.5 border-t border-[#eee9e0] pt-4 text-xs [&_dd]:m-0 [&_dd]:text-right [&_dt]:text-msds-muted">
                    <dt>최대 인원</dt>
                    <dd>{room.max_guest_count}명</dd>
                    <dt>숙박 일수</dt>
                    <dd>{room.nights}박</dd>
                    <dt>1박 기준가</dt>
                    <dd>{won(room.base_price)}</dd>
                    <dt>총 예약 금액</dt>
                    <dd className="m-0 text-right text-msds-gold">{won(room.total_price)}</dd>
                  </dl>
                  <div className="mt-[18px] flex items-center justify-between">
                    <small className="text-[11px] text-msds-muted">
                      남은 객실 {room.remaining_count}개
                    </small>
                    <button
                      className="rounded-msds bg-msds-navy px-6 py-[13px] text-xs tracking-[0.06em] text-white transition hover:bg-msds-navy-light disabled:cursor-not-allowed disabled:bg-[#bdbbb6]"
                      disabled={!room.available}
                      onClick={() =>
                        navigate(
                          `/reservations/confirm?room_id=${room.room_id}&check_in_date=${form.check_in_date}&check_out_date=${form.check_out_date}&guest_count=${form.guest_count}`,
                        )
                      }
                    >
                      이 객실 예약
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {!loading && !error && rooms === null && (
        <p className="my-[45px] text-sm text-msds-muted">
          날짜와 인원을 입력하면 예약 가능한 객실 유형을 안내합니다.
        </p>
      )}
    </main>
  )
}
