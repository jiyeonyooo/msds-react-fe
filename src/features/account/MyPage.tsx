import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, StatusBadge } from '../../components/ui'
import { ApiError } from '../../lib/apiError'
import { signOut } from '../auth/api'
import type { UserProfile } from '../auth/types'
import { useSession } from '../auth/useSession'
import { reservationApi } from '../reservation/api'
import type { Reservation } from '../reservation/types'
import { accountApi } from './api'
import { AccountLayout } from './AccountLayout'

const quickLinks = [
  {
    kicker: 'STAY',
    title: '예약 조회',
    description: '예약 가능한 객실을 확인하고 머무를 날짜를 정합니다.',
    to: '/reservations',
    action: '객실 보기 →',
  },
  {
    kicker: 'INQUIRY',
    title: '문의 남기기',
    description: '머무름에 대해 궁금한 점을 남기면 답변을 보내 드립니다.',
    to: '/inquiries/new',
    action: '문의 작성 →',
  },
  {
    kicker: 'ACCOUNT',
    title: '정보 수정',
    description: '이름과 전화번호를 최신 정보로 유지해 주세요.',
    to: '/mypage/edit',
    action: '정보 수정 →',
  },
]
const dateOf = (value?: string) => value?.slice(0, 10) ?? '-'
const won = (value: number) => `${value.toLocaleString('ko-KR')}원`
const RECENT_RESERVATION_COUNT = 3

/** 마이페이지. GET /api/users/me 로 받은 회원 정보를 보여 준다. */
export function MyPage() {
  const navigate = useNavigate()
  const session = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(session?.user ?? null)
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [reservationTotal, setReservationTotal] = useState(0)
  const [reservationLoading, setReservationLoading] = useState(true)
  const [reservationError, setReservationError] = useState('')

  useEffect(() => {
    void accountApi
      .me()
      .then((response) => setProfile(response.data))
      .catch((cause) => setError((cause as ApiError).message))
  }, [])

  // 예약 내역은 회원 정보와 별개로 실패할 수 있으므로 오류를 따로 들고 있는다.
  // 예약 조회가 실패해도 회원 정보는 그대로 보여야 한다.
  useEffect(() => {
    let active = true
    void reservationApi
      .mine({ pageSize: RECENT_RESERVATION_COUNT })
      .then((result) => {
        if (!active) return
        setReservations(result.content)
        setReservationTotal(result.total_elements)
      })
      .catch((cause) => {
        if (!active) return
        setReservationError((cause as ApiError).message || '예약 내역을 불러오지 못했습니다.')
      })
      .finally(() => active && setReservationLoading(false))
    return () => {
      active = false
    }
  }, [])

  const fields = [
    { label: '이름', value: profile?.name ?? '-' },
    { label: '이메일', value: profile?.email ?? '-' },
    { label: '전화번호', value: profile?.phoneNumber ?? '-' },
    { label: '회원 권한', value: profile?.role ?? '-' },
    { label: '가입일', value: dateOf(profile?.createdAt) },
    { label: '최근 수정', value: profile?.updatedAt ?? '-' },
  ]

  return (
    <AccountLayout
      description="예약과 문의 내역을 한 곳에서 확인하고, 회원 정보를 최신 상태로 유지하세요."
      eyebrow="MY PAGE"
      hero={
        <div className="flex w-full items-start gap-5 rounded-xl bg-white p-7 lg:w-[440px]">
          <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-navy-900 text-2xl font-medium text-white">
            {profile?.name?.slice(0, 1) ?? '·'}
          </span>
          <div className="grid gap-1.5">
            <span className="flex h-6 w-fit items-center rounded-full bg-gold-500 px-2.5 text-[10px] font-medium tracking-[0.12em] text-navy-900">
              {profile?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
            </span>
            <strong className="text-xl leading-[30px] font-medium text-navy-900">
              {profile?.name ?? '회원'}님
            </strong>
            <span className="text-[13px] text-secondary">{profile?.email ?? '-'}</span>
            <span className="text-xs text-secondary/70">가입일 {dateOf(profile?.createdAt)}</span>
          </div>
        </div>
      }
      title="나의 고요를 이어가세요"
    >
      <article className="rounded-xl border border-border-subtle bg-white px-8 py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="font-display text-[28px] leading-[34px] font-medium text-navy-900">
              회원정보
            </h2>
            <p className="text-[10px] tracking-[0.08em] text-muted">
              예약 확인과 문의 응대에 사용되는 기본 정보입니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/mypage/edit')} size="sm">
              정보 수정
            </Button>
            <Button onClick={() => navigate('/mypage/delete')} size="sm" variant="secondary">
              회원 탈퇴
            </Button>
          </div>
        </div>
        <span className="my-4 block h-px w-full bg-border-subtle" />
        {error && (
          <p className="mb-4 text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
        <dl className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {fields.map((field) => (
            <div className="grid gap-[7px]" key={field.label}>
              <dt className="text-[11px] font-medium tracking-[0.08em] text-muted">
                {field.label}
              </dt>
              <dd className="m-0 text-[15px] break-all text-navy-900">{field.value}</dd>
            </div>
          ))}
        </dl>
      </article>
      <article className="rounded-xl border border-border-subtle bg-white px-8 py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="font-display text-[28px] leading-[34px] font-medium text-navy-900">
              예약 내역
            </h2>
            <p className="text-[10px] tracking-[0.08em] text-muted">
              {reservationTotal > 0
                ? `전체 ${reservationTotal.toLocaleString('ko-KR')}건 중 최근 ${Math.min(reservations.length, RECENT_RESERVATION_COUNT)}건입니다.`
                : '머무름을 예약하면 여기에서 확인할 수 있습니다.'}
            </p>
          </div>
          <Link
            className="text-[11px] font-medium tracking-[0.08em] text-navy-900"
            to="/my-reservations"
          >
            전체 예약 보기 →
          </Link>
        </div>
        <span className="my-4 block h-px w-full bg-border-subtle" />
        {reservationError && (
          <p className="text-[13px] text-error" role="alert">
            {reservationError}
          </p>
        )}
        {!reservationError && reservationLoading && (
          <p className="py-8 text-center text-[13px] text-muted" role="status">
            예약 내역을 불러오는 중입니다…
          </p>
        )}
        {!reservationError && !reservationLoading && reservations.length === 0 && (
          <div className="grid justify-items-center gap-4 py-8 text-center">
            <p className="text-[13px] text-muted">아직 예약한 머무름이 없습니다.</p>
            <Link to="/reservations">
              <Button size="sm">객실 둘러보기</Button>
            </Link>
          </div>
        )}
        {!reservationError && !reservationLoading && reservations.length > 0 && (
          <ul className="grid gap-0">
            {reservations.map((reservation) => (
              <li
                className="grid gap-2 border-b border-border-subtle py-4 last:border-0 md:grid-cols-[1.3fr_1.2fr_0.9fr_auto] md:items-center"
                key={reservation.resv_id}
              >
                <div className="grid gap-0.5">
                  <span className="text-[15px] text-navy-900">{reservation.room_name}</span>
                  <span className="text-[11px] text-muted">{reservation.reservation_number}</span>
                </div>
                <span className="text-[13px] text-secondary">
                  {reservation.check_in_date} ~ {reservation.check_out_date}
                </span>
                <span className="text-[13px] text-navy-900">{won(reservation.total_price)}</span>
                <div className="flex items-center gap-3 md:justify-self-end">
                  <StatusBadge status={reservation.status} />
                  <Link
                    className="text-[11px] font-medium tracking-[0.08em] text-gold-500"
                    to={`/my-reservations/${reservation.resv_id}`}
                  >
                    상세 →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {quickLinks.map((link, index) => (
          <article
            className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-white p-6"
            key={link.to}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle font-display text-lg text-gold-500">
              {`0${index + 1}`}
            </span>
            <p className="text-[10px] font-medium tracking-[0.1em] text-gold-500">{link.kicker}</p>
            <h3 className="font-display text-2xl leading-[31px] font-medium text-navy-900">
              {link.title}
            </h3>
            <p className="text-xs leading-5 text-secondary">{link.description}</p>
            <Link className="text-[11px] font-medium tracking-[0.08em] text-navy-900" to={link.to}>
              {link.action}
            </Link>
          </article>
        ))}
      </div>
      <div>
        <button
          className="border-0 bg-transparent p-0 text-xs tracking-[0.06em] text-muted"
          onClick={() => void signOut().then(() => navigate('/'))}
          type="button"
        >
          로그아웃
        </button>
      </div>
    </AccountLayout>
  )
}
