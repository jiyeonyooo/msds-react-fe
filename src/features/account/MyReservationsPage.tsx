import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, StatusBadge } from '../../components/ui'
import type { ApiError } from '../../lib/apiError'
import { reservationApi } from '../reservation/api'
import type { Reservation, ReservationStatus } from '../reservation/types'
import { SkeletonRows } from '../../components/motion'
import { AccountLayout } from './AccountLayout'
import { AccountEmptyState, AccountPanel, AccountPanelAction } from './AccountPanel'

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`
const PAGE_SIZE = 10

function formatDateTime(value?: string) {
  if (!value) return '-'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/)
  return match ? `${match[1]}. ${match[2]}. ${match[3]}. ${match[4]}:${match[5]}` : value
}

const statusFilters: { value: 'ALL' | ReservationStatus; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'RESERVED', label: '예약 완료' },
  { value: 'CANCELLED', label: '취소' },
]

/**
 * 계정 영역의 예약 내역.
 * 회원정보 안에 최근 몇 건만 얹어 두면 목록이 길어질수록 정보가 묻히므로 별도 화면으로 분리했다.
 * 취소·상세 조작은 /mypage/reservations/:resvId 화면에서 담당한다.
 */
export function MyAccountReservationsPage() {
  const [items, setItems] = useState<Reservation[]>([])
  const [status, setStatus] = useState<'ALL' | ReservationStatus>('ALL')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await reservationApi.mine({
          status: status === 'ALL' ? undefined : status,
          page,
          pageSize: PAGE_SIZE,
        })
        if (!active) return
        setItems(result.content)
        setTotalPages(result.total_pages)
        setTotal(result.total_elements)
      } catch (cause) {
        if (!active) return
        setError((cause as ApiError).message || '예약 내역을 불러오지 못했습니다.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [page, status])

  function selectStatus(next: 'ALL' | ReservationStatus) {
    setStatus(next)
    setPage(0)
  }

  return (
    <AccountLayout
      description="지금까지 예약하신 머무름을 모아 봅니다. 취소와 상세 확인은 예약 상세에서 하실 수 있습니다."
      eyebrow="MY STAYS"
      title="예약 내역"
    >
      <AccountPanel
        action={<AccountPanelAction to="/reservations">새로 예약하기</AccountPanelAction>}
        meta={loading ? '불러오는 중…' : `총 ${total.toLocaleString('ko-KR')}건`}
        title="예약 목록"
        toolbar={
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="예약 상태 필터">
            {statusFilters.map((filter) => (
              <button
                aria-pressed={status === filter.value}
                className={`h-9 rounded-full border px-4 text-xs font-medium transition ${
                  status === filter.value
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : 'border-border-subtle bg-white text-secondary hover:border-gold-300'
                }`}
                key={filter.value}
                onClick={() => selectStatus(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        }
      >
        {error && (
          <p className="text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
        {!error && loading && (
          <SkeletonRows rows={3} />
        )}
        {!error && !loading && items.length === 0 && (
          <AccountEmptyState
            actionLabel={status === 'ALL' ? '객실 둘러보기' : undefined}
            actionTo={status === 'ALL' ? '/reservations' : undefined}
            message={
              status === 'ALL'
                ? '아직 예약한 머무름이 없습니다. 마음에 드는 객실을 골라 보세요.'
                : '해당 상태의 예약이 없습니다.'
            }
          />
        )}
        {!error && !loading && items.length > 0 && (
          <ul className="grid gap-0">
            {items.map((reservation) => (
              <li
                className="grid gap-2 border-b border-border-subtle py-4 last:border-0 md:grid-cols-[1.3fr_1.2fr_0.9fr_0.9fr_auto] md:items-center"
                key={reservation.resv_id}
              >
                <div className="grid gap-0.5">
                  <span className="text-[15px] text-navy-900">{reservation.room_name}</span>
                  <span className="text-[11px] text-muted">{reservation.reservation_number}</span>
                </div>
                <span className="text-[13px] text-secondary">
                  {reservation.check_in_date} ~ {reservation.check_out_date}
                  <span className="ml-2 text-[11px] text-muted">{reservation.guest_count}인</span>
                </span>
                <div className="grid gap-0.5">
                  <span className="text-[11px] text-muted">예약 일시 {formatDateTime(reservation.created_at)}</span>
                  {reservation.cancelled_at && <span className="text-[11px] text-muted">취소 일시 {formatDateTime(reservation.cancelled_at)}</span>}
                  <span className="text-[13px] text-navy-900">{won(reservation.total_price)}</span>
                </div>
                <div className="flex items-center gap-3 md:justify-self-end">
                  <StatusBadge status={reservation.status} />
                  <Link
                    className="text-[11px] font-medium tracking-[0.08em] text-gold-500"
                    to={`/mypage/reservations/${reservation.resv_id}`}
                  >
                    상세 →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {page + 1} / {totalPages} 페이지
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page <= 0}
                onClick={() => setPage(page - 1)}
                size="sm"
                variant="secondary"
              >
                이전
              </Button>
              <Button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
                size="sm"
                variant="secondary"
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </AccountPanel>
    </AccountLayout>
  )
}
