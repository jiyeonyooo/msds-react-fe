import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../../lib/navigation'
import { ApiError, reservationApi } from './api'
import type { Reservation, ReservationStatus } from './types'
const won = (value: number) => `${value.toLocaleString('ko-KR')}원`
const label = (status: ReservationStatus) => (status === 'RESERVED' ? '예약 완료' : '취소 완료')
export function MyReservationsPage() {
  const id = window.location.pathname.split('/')[2]
  const [items, setItems] = useState<Reservation[]>([])
  const [detail, setDetail] = useState<Reservation | null>(null)
  const [status, setStatus] = useState<'ALL' | ReservationStatus>('ALL')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMessage('')
      try {
        if (id) setDetail(await reservationApi.detail(id))
        else setItems((await reservationApi.mine()).content)
      } catch (e) {
        const err = e as ApiError
        if (err.status === 401) {
          sessionStorage.setItem('return_path', window.location.pathname)
          navigate('/login')
          return
        }
        setMessage(
          err.status === 403
            ? '예약 내역을 볼 권한이 없습니다.'
            : err.status === 404
              ? '요청하신 예약을 찾을 수 없습니다.'
              : err.message || '예약 내역을 불러오지 못했습니다.',
        )
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])
  const filtered = useMemo(
    () => (status === 'ALL' ? items : items.filter((item) => item.status === status)),
    [items, status],
  )
  async function cancel() {
    if (!detail || !confirm('예약을 취소하시겠습니까? 취소 후에는 되돌릴 수 없습니다.')) return
    try {
      setDetail(await reservationApi.cancel(String(detail.resv_id)))
    } catch (e) {
      const err = e as ApiError
      if (err.code === 'RESV_CANNOT_CANCEL') {
        setDetail(await reservationApi.detail(String(detail.resv_id)))
        setMessage('현재 예약 상태에서는 취소할 수 없습니다.')
      } else setMessage(err.message)
    }
  }
  if (loading)
    return (
      <main className="page">
        <p>예약 정보를 불러오는 중입니다…</p>
      </main>
    )
  if (message && !detail && !items.length)
    return (
      <main className="page error-page">
        <h1>{message}</h1>
        <button
          className="primary-button"
          onClick={() => navigate(id ? '/my-reservations' : '/reservations')}
        >
          돌아가기
        </button>
      </main>
    )
  if (detail) {
    const canCancel =
      detail.status === 'RESERVED' &&
      detail.check_in_date >
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
    return (
      <main className="page detail-page">
        <button className="back-button" onClick={() => navigate('/my-reservations')}>
          ← 나의 예약으로
        </button>
        <p className="eyebrow gold">RESERVATION DETAIL</p>
        <h1>예약 상세</h1>
        {message && <p className="form-error">{message}</p>}
        <ReservationCard reservation={detail} detail />
        {canCancel ? (
          <section className="cancel-area">
            <p>취소는 체크인 전날까지 가능합니다.</p>
            <button className="danger-button" onClick={() => void cancel()}>
              예약 취소
            </button>
          </section>
        ) : (
          detail.status === 'RESERVED' && (
            <p className="form-error">체크인 당일 또는 이후에는 예약을 취소할 수 없습니다.</p>
          )
        )}
      </main>
    )
  }
  return (
    <main className="page">
      <p className="eyebrow gold">MY RESERVATIONS</p>
      <h1>나의 예약</h1>
      <p className="lead">머무름의 일정과 예약 상태를 확인하세요.</p>
      <div className="tabs" role="tablist">
        {(
          [
            ['ALL', '전체'],
            ['RESERVED', '예약 완료'],
            ['CANCELLED', '취소 완료'],
          ] as const
        ).map(([value, text]) => (
          <button
            key={value}
            role="tab"
            aria-selected={status === value}
            className={status === value ? 'selected' : ''}
            onClick={() => setStatus(value)}
          >
            {text}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          예약 내역이 없습니다.
          <br />
          <button className="primary-button" onClick={() => navigate('/reservations')}>
            예약하기
          </button>
        </div>
      ) : (
        <div className="reservation-list">
          {filtered.map((item) => (
            <ReservationCard
              key={item.resv_id}
              reservation={item}
              onClick={() => navigate(`/my-reservations/${item.resv_id}`)}
            />
          ))}
        </div>
      )}
    </main>
  )
}
function ReservationCard({
  reservation,
  detail,
  onClick,
}: {
  reservation: Reservation
  detail?: boolean
  onClick?: () => void
}) {
  return (
    <article
      className={detail ? 'reservation-card detail-card' : 'reservation-card'}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div>
        <span className="eyebrow">RESERVATION NUMBER</span>
        <h2>{reservation.reservation_number}</h2>
      </div>
      <span className={reservation.status === 'RESERVED' ? 'status available' : 'status'}>
        {label(reservation.status)}
      </span>
      <dl>
        <dt>객실</dt>
        <dd>
          {reservation.room_name}
          {reservation.room_number ? ` · ${reservation.room_number}호` : ''}
        </dd>
        <dt>일정</dt>
        <dd>
          {reservation.check_in_date} — {reservation.check_out_date} · {reservation.nights}박
        </dd>
        <dt>인원</dt>
        <dd>성인 {reservation.guest_count}명</dd>
        <dt>총 예약 금액</dt>
        <dd className="gold">{won(reservation.total_price)}</dd>
        {detail && reservation.cancelled_at && (
          <>
            <dt>취소 일시</dt>
            <dd>{reservation.cancelled_at}</dd>
          </>
        )}
      </dl>
    </article>
  )
}
