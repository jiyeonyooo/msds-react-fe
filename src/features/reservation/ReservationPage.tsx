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
    <main className="page reservation-page">
      <p className="eyebrow gold">MAKE A RESERVATION</p>
      <h1>예약하기</h1>
      <p className="lead">원하시는 머무름의 시간과 인원을 선택해 주세요.</p>
      <form className="search-form" onSubmit={search}>
        <label>
          CHECK-IN
          <input
            type="date"
            min={today}
            value={form.check_in_date}
            onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
          />
        </label>
        <label>
          CHECK-OUT
          <input
            type="date"
            min={form.check_in_date}
            value={form.check_out_date}
            onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
          />
        </label>
        <label>
          GUESTS
          <select
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
        <button className="primary-button" disabled={loading}>
          {loading ? '조회 중…' : '예약 가능 객실 보기'}
        </button>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {rooms?.length === 0 && (
        <div className="empty-state">
          예약 가능한 객실 유형이 없습니다. 다른 날짜를 선택해 주세요.
        </div>
      )}
      {rooms && rooms.length > 0 && (
        <section className="room-results">
          <div className="result-heading">
            <div>
              <p className="eyebrow gold">AVAILABILITY</p>
              <h2>
                {form.check_in_date.replaceAll('-', '.')} —{' '}
                {form.check_out_date.replaceAll('-', '.')}
              </h2>
            </div>
            <p>표시된 금액과 잔여 객실은 서버 기준입니다. 예약 생성 시 다시 확인됩니다.</p>
          </div>
          <div className="room-grid">
            {rooms.map((room) => (
              <article className="room-card" key={room.room_id}>
                <div
                  className="room-image"
                  style={room.image_url ? { backgroundImage: `url(${room.image_url})` } : undefined}
                />
                <div className="room-body">
                  <span className={room.available ? 'status available' : 'status'}>
                    {room.available ? '예약 가능' : '예약 마감'}
                  </span>
                  <h3>{room.room_name}</h3>
                  <p>{room.description ?? '고요한 휴식을 위한 객실입니다.'}</p>
                  <dl>
                    <dt>최대 인원</dt>
                    <dd>{room.max_guest_count}명</dd>
                    <dt>숙박 일수</dt>
                    <dd>{room.nights}박</dd>
                    <dt>1박 기준가</dt>
                    <dd>{won(room.base_price)}</dd>
                    <dt>총 예약 금액</dt>
                    <dd className="gold">{won(room.total_price)}</dd>
                  </dl>
                  <div className="card-footer">
                    <small>남은 객실 {room.remaining_count}개</small>
                    <button
                      className="primary-button"
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
        <p className="hint">날짜와 인원을 입력하면 예약 가능한 객실 유형을 안내합니다.</p>
      )}
    </main>
  )
}
