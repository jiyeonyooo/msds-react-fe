import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, StatusBadge } from '../../components/ui'
import { setReturnPath } from '../auth/session'
import { ApiError } from '../../lib/apiError'
import { resolveProgramImageUrl } from '../../lib/imageUrl'
import { cancelReservation, getMyProgramReservations } from './program'
import type { ProgramReservationResponse, ProgramReservationStatus } from './types'

type StatusFilter = 'ALL' | ProgramReservationStatus

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function MyProgramReservationsPage() {
  const [reservations, setReservations] = useState<ProgramReservationResponse[]>([])
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleLoadError = (loadError: unknown) => {
    if (loadError instanceof ApiError && loadError.status === 401) {
      setReturnPath('/my-programs')
      window.location.assign('/login')
      return
    }
    setError(
      loadError instanceof Error && loadError.message
        ? loadError.message
        : '프로그램 신청 내역을 불러오지 못했습니다.',
    )
  }

  const refresh = async () => {
    try {
      setReservations(await getMyProgramReservations())
    } catch (loadError) {
      handleLoadError(loadError)
    }
  }

  useEffect(() => {
    let active = true
    getMyProgramReservations()
      .then((items) => {
        if (active) setReservations(items)
      })
      .catch((loadError: unknown) => {
        if (active) handleLoadError(loadError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filteredReservations = useMemo(
    () => reservations.filter((reservation) => filter === 'ALL' || reservation.status === filter),
    [filter, reservations],
  )

  const handleCancel = async (reservation: ProgramReservationResponse) => {
    if (!window.confirm(`‘${reservation.programName}’ 신청을 취소하시겠습니까?`)) return
    try {
      setError('')
      setMessage('')
      await cancelReservation(reservation.reservationId)
      await refresh()
      setMessage('프로그램 신청이 취소되었습니다.')
    } catch (cancelError) {
      handleLoadError(cancelError)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] md:pt-[90px]">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">MY PROGRAMS</p>
      <h1 className="my-2.5 font-display text-[52px] leading-[0.95] tracking-[-0.125rem] md:text-[62px]">
        나의 명상 프로그램
      </h1>
      <p className="text-sm text-muted">신청한 명상 프로그램과 현재 상태를 확인하세요.</p>

      <div className="mt-9 grid max-w-md grid-cols-2 rounded-sm border border-[#cfc7ba] bg-white p-1">
        <Link
          className="px-5 py-3 text-center text-xs font-medium text-ink-500"
          to="/mypage/reservations"
        >
          객실 예약
        </Link>
        <span className="bg-navy-900 px-5 py-3 text-center text-xs font-medium text-white">
          명상 프로그램
        </span>
      </div>

      <div className="mt-7 border-b border-border-subtle" role="tablist">
        {(
          [
            ['ALL', '전체'],
            ['RESERVED', '예약 완료'],
            ['CANCELLED', '취소 완료'],
          ] as const
        ).map(([value, label]) => (
          <button
            aria-selected={filter === value}
            className={`mr-6 border-b-2 border-transparent bg-transparent px-2 pb-[13px] text-muted ${
              filter === value ? 'border-gold-500 text-navy-900' : ''
            }`}
            key={value}
            onClick={() => setFilter(value)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <p
          className="mt-5 rounded-sm border border-border-accent bg-[#faf6ed] px-4 py-3 text-sm text-ink-700"
          role="status"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          className="mt-5 rounded-sm border border-error-border bg-[#f8eeeb] px-4 py-3 text-sm text-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-muted">프로그램 신청 내역을 불러오는 중입니다…</p>
      ) : filteredReservations.length === 0 ? (
        <div className="mt-[30px] border border-dashed border-gold-300 px-6 py-[70px] text-center leading-loose text-muted">
          프로그램 신청 내역이 없습니다.
          <br />
          <Link
            className="mt-[18px] inline-flex min-h-[44px] items-center justify-center rounded-sm bg-navy-900 px-6 py-[13px] text-xs font-medium text-white"
            to="/programs"
          >
            프로그램 둘러보기
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {filteredReservations.map((reservation) => (
            <article
              className="grid gap-5 border border-border-subtle bg-white p-6 sm:grid-cols-[92px_1fr_auto] sm:items-center"
              key={reservation.reservationId}
            >
              <div className="grid size-[92px] place-items-center overflow-hidden rounded-sm bg-[#e8e3d9] text-[10px] text-ink-500">
                {reservation.pictureUrl ? (
                  <img alt="" className="size-full object-cover" src={resolveProgramImageUrl(reservation.pictureUrl)} />
                ) : (
                  'NO IMAGE'
                )}
              </div>
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] text-gold-500">
                  MEDITATION PROGRAM
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold">
                  {reservation.programName}
                </h2>
                <p className="mt-2 text-xs text-ink-500">
                  신청 인원 {reservation.quantity}명 · 신청일 {formatDate(reservation.createdAt)}
                </p>
                {reservation.cancelledAt && (
                  <p className="mt-1 text-xs text-ink-500">
                    취소일 {formatDate(reservation.cancelledAt)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 sm:block sm:text-right">
                <StatusBadge status={reservation.status} />
                {reservation.status === 'RESERVED' && (
                  <Button
                    className="sm:mt-3 sm:block"
                    onClick={() => void handleCancel(reservation)}
                    size="sm"
                    variant="danger"
                  >
                    신청 취소
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
