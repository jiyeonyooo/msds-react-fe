import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, StatusBadge } from '../../components/ui'
import { navigate } from '../../lib/navigation'
import { ApiError, reservationApi } from './api'
import type { Reservation, ReservationStatus } from './types'

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`
export function MyReservationsPage() {
  const { resvId: id } = useParams()
  const [items, setItems] = useState<Reservation[]>([])
  const [detail, setDetail] = useState<Reservation | null>(null)
  const [status, setStatus] = useState<'ALL' | ReservationStatus>('ALL')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMessage('')
      try {
        if (id) setDetail(await reservationApi.detail(id))
        else {
          const result = await reservationApi.mine({
            status: status === 'ALL' ? undefined : status,
            page,
          })
          setItems(result.content)
          setTotalPages(result.total_pages)
        }
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
  }, [id, page, status])
  const filtered = useMemo(() => items, [items])
  async function cancel() {
    if (!detail || !confirm('예약을 취소하시겠습니까? 취소 후에는 되돌릴 수 없습니다.')) return
    try {
      const cancelled = await reservationApi.cancel(String(detail.resv_id))
      setDetail({ ...detail, ...cancelled })
    } catch (e) {
      const err = e as ApiError
      if (err.status === 401) {
        sessionStorage.setItem('return_path', window.location.pathname)
        navigate('/login')
        return
      }
      if (err.code === 'RESV_CANNOT_CANCEL') {
        setDetail(await reservationApi.detail(String(detail.resv_id)))
        setMessage('현재 예약 상태에서는 취소할 수 없습니다.')
      } else if (err.status === 403) setMessage('이 예약을 취소할 권한이 없습니다.')
      else if (err.status === 404) setMessage('예약 정보를 찾을 수 없습니다.')
      else setMessage(err.message)
    }
  }
  if (loading)
    return (
      <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] md:pt-[90px]">
        <p>예약 정보를 불러오는 중입니다…</p>
      </main>
    )
  if (message && !detail && !items.length)
    return (
      <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] text-center md:pt-[90px]">
        <h1 className="my-2.5 font-display text-[52px] leading-[0.95] tracking-[-0.125rem] md:text-[62px]">
          {message}
        </h1>
        <Button onClick={() => navigate(id ? '/mypage/reservations' : '/reservations')}>
          돌아가기
        </Button>
      </main>
    )
  if (detail) {
    const canCancel =
      detail.status === 'RESERVED' &&
      detail.check_in_date >
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
    return (
      <main className="mx-auto max-w-[850px] px-6 pt-[58px] pb-[110px] md:pt-[90px]">
        <Button className="mb-[25px]" variant="text" onClick={() => navigate('/mypage/reservations')}>
          ← 나의 예약으로
        </Button>
        <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">
          RESERVATION DETAIL
        </p>
        <h1 className="my-2.5 font-display text-[52px] leading-[0.95] tracking-[-0.125rem] md:text-[62px]">
          예약 상세
        </h1>
        {message && <p className="mt-[14px] text-[13px] text-error">{message}</p>}
        <ReservationCard reservation={detail} detail />
        {canCancel ? (
          <section className="mt-6 border-t border-border-subtle pt-5 text-xs text-muted">
            <p>취소는 체크인 전날까지 가능합니다.</p>
            <Button variant="danger" onClick={() => void cancel()}>
              예약 취소
            </Button>
          </section>
        ) : (
          detail.status === 'RESERVED' && (
            <p className="mt-[14px] text-[13px] text-error">
              체크인 당일 또는 이후에는 예약을 취소할 수 없습니다.
            </p>
          )
        )}
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] md:pt-[90px]">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">MY RESERVATIONS</p>
      <h1 className="my-2.5 font-display text-[52px] leading-[0.95] tracking-[-0.125rem] md:text-[62px]">
        나의 예약
      </h1>
      <p className="text-sm text-muted">머무름의 일정과 프로그램 신청 상태를 확인하세요.</p>
      <div className="mt-9 grid max-w-md grid-cols-2 rounded-sm border border-[#cfc7ba] bg-white p-1">
        <span className="bg-navy-900 px-5 py-3 text-center text-xs font-medium text-white">
          객실 예약
        </span>
        <button
          className="px-5 py-3 text-xs font-medium text-ink-500"
          onClick={() => navigate('/my-programs')}
          type="button"
        >
          명상 프로그램
        </button>
      </div>
      <div className="mt-7 border-b border-border-subtle" role="tablist">
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
            className={`mr-6 border-b-2 border-transparent bg-transparent px-2 pb-[13px] text-muted ${status === value ? 'border-gold-500 text-navy-900' : ''}`}
            onClick={() => {
              setStatus(value)
              setPage(0)
            }}
          >
            {text}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="mt-[30px] border border-dashed border-gold-300 px-6 py-[70px] text-center leading-loose text-muted">
          예약 내역이 없습니다.
          <br />
          <Button className="mt-[18px]" onClick={() => navigate('/reservations')}>
            예약하기
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3">
            {filtered.map((item) => (
              <ReservationCard
                key={item.resv_id}
                reservation={item}
                onClick={() => navigate(`/mypage/reservations/${item.resv_id}`)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <nav
              className="mt-6 flex items-center justify-center gap-3"
              aria-label="예약 내역 페이지"
            >
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                이전
              </Button>
              <span className="text-sm">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                다음
              </Button>
            </nav>
          )}
        </>
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
      className={`grid grid-cols-[1fr_auto] gap-[18px] border border-border-subtle bg-white p-[26px] ${detail ? 'mt-[38px]' : 'hover:border-gold-500'} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div>
        <span className="text-[11px] font-medium tracking-[0.17em]">RESERVATION NUMBER</span>
        <h2 className="my-[7px] font-display text-[23px] font-medium">
          {reservation.reservation_number}
        </h2>
      </div>
      <StatusBadge status={reservation.status} />
      <dl className="col-span-2 grid grid-cols-2 gap-2.5 border-t border-[#eee9e0] pt-4 text-xs [&_dd]:m-0 [&_dd]:text-right [&_dt]:text-muted">
        <dt>객실</dt>
        <dd>
          {reservation.room_name}
          {reservation.room_number ? ` · ${reservation.room_number}호` : ''}
        </dd>
        <dt>일정</dt>
        <dd>
          {reservation.check_in_date} — {reservation.check_out_date}
          {reservation.nights === undefined ? '' : ` · ${reservation.nights}박`}
        </dd>
        <dt>인원</dt>
        <dd>성인 {reservation.guest_count}명</dd>
        <dt>총 예약 금액</dt>
        <dd className="text-gold-500">{won(reservation.total_price)}</dd>
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
