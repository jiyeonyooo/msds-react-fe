import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CountUp } from '../../components/motion'
import { adminInquiryApi } from './inquiryApi'
import { adminMemberApi } from './memberApi'
import { adminReservationApi } from './reservationApi'
import { adminNavigation, adminNavigationGroups, type AdminNavigationItem } from './adminNavigation'

type Summary = {
  members?: number
  newMembersToday?: number
  newMembersWeek?: number
  reservations?: number
  cancelledReservations?: number
  waitingInquiries?: number
}

/**
 * 대시보드 상단 요약.
 *
 * 네 개 지표를 각각 다른 API에서 가져온다. 하나가 실패해도 나머지는 보여야 하므로
 * allSettled로 받고, 실패한 칸만 '–'로 남긴다.
 */
function useAdminSummary() {
  const [summary, setSummary] = useState<Summary>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void Promise.allSettled([
      adminMemberApi.stats(),
      adminReservationApi.list({ page_num: 0, page_size: 1 }),
      adminReservationApi.list({ resv_status: 'CANCELLED', page_num: 0, page_size: 1 }),
      adminInquiryApi.list('WAITING'),
    ]).then(([members, reservations, cancelled, inquiries]) => {
      if (!active) return
      setSummary({
        ...(members.status === 'fulfilled'
          ? {
              members: members.value.data.total_users,
              newMembersToday: members.value.data.new_users_today,
              newMembersWeek: members.value.data.new_users_last_7_days,
            }
          : {}),
        ...(reservations.status === 'fulfilled'
          ? { reservations: reservations.value.total_elements }
          : {}),
        ...(cancelled.status === 'fulfilled'
          ? { cancelledReservations: cancelled.value.total_elements }
          : {}),
        ...(inquiries.status === 'fulfilled'
          ? { waitingInquiries: inquiries.value.data.length }
          : {}),
      })
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return { summary, loading }
}

export function AdminHomePage() {
  const { summary, loading } = useAdminSummary()

  return (
    <>
      <PageHeading
        description="오늘 처리할 일과 관리 기능을 한눈에 봅니다."
        title="운영 대시보드"
      />

      <section aria-label="운영 요약" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          caption={
            summary.newMembersToday === undefined
              ? '가입 회원'
              : `오늘 ${summary.newMembersToday}명 · 최근 7일 ${summary.newMembersWeek ?? 0}명`
          }
          label="전체 회원"
          loading={loading}
          to="/admin/members"
          unit="명"
          value={summary.members}
        />
        <MetricTile
          caption="취소 건을 포함한 전체 예약"
          label="전체 예약"
          loading={loading}
          to="/admin/reservations"
          unit="건"
          value={summary.reservations}
        />
        <MetricTile
          caption={
            summary.reservations && summary.cancelledReservations !== undefined
              ? `전체의 ${Math.round((summary.cancelledReservations / summary.reservations) * 100)}%`
              : '취소 상태로 바뀐 예약'
          }
          label="취소 예약"
          loading={loading}
          to="/admin/reservations"
          unit="건"
          value={summary.cancelledReservations}
        />
        <MetricTile
          caption={
            summary.waitingInquiries ? '답변을 기다리는 문의가 있습니다.' : '밀린 문의가 없습니다.'
          }
          highlight={Boolean(summary.waitingInquiries)}
          label="답변 대기 문의"
          loading={loading}
          to="/admin/inquiries"
          unit="건"
          value={summary.waitingInquiries}
        />
      </section>

      {adminNavigationGroups.map((group) => {
        const items = adminNavigation.filter((item) => item.group === group.id)
        if (items.length === 0) return null
        return (
          <section aria-labelledby={`admin-group-${group.id}`} className="mt-10" key={group.id}>
            <div className="flex items-baseline gap-3">
              <h3
                className="font-display text-xl font-medium text-navy-900"
                id={`admin-group-${group.id}`}
              >
                {group.id}
              </h3>
              <p className="text-xs text-ink-500">{group.caption}</p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <FeatureCard item={item} key={item.to} />
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}

function MetricTile({
  label,
  value,
  unit,
  caption,
  to,
  loading,
  highlight = false,
}: {
  label: string
  value?: number
  unit: string
  caption: string
  to: string
  loading: boolean
  highlight?: boolean
}) {
  return (
    <Link
      className={`group rounded-lg border bg-white px-5 py-4 shadow-card transition hover:-translate-y-0.5 ${highlight ? 'border-gold-300' : 'border-border-subtle hover:border-gold-300'}`}
      to={to}
    >
      <p className="text-[10px] font-medium tracking-[0.14em] text-ink-500">{label}</p>
      <p
        className={`mt-1.5 font-display text-[32px] leading-none font-medium ${highlight ? 'text-gold-500' : 'text-navy-900'}`}
      >
        {loading ? '–' : <CountUp value={value} />}
        <span className="ml-1 font-sans text-xs font-normal text-ink-500">{unit}</span>
      </p>
      <p className="mt-2.5 text-[11px] leading-4 text-ink-500">{caption}</p>
    </Link>
  )
}

function FeatureCard({ item }: { item: AdminNavigationItem }) {
  return (
    <Link
      className="group relative overflow-hidden rounded-lg border border-border-subtle bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-gold-300"
      to={item.to}
    >
      {/* 왼쪽 금색 띠는 평소 숨어 있다가 hover 때만 드러나 어느 카드를 겨누는지 알려 준다. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-0.5 bg-gold-500 opacity-0 transition group-hover:opacity-100"
      />
      <p className="font-display text-[22px] leading-tight font-medium text-navy-900">
        {item.label}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink-500">{item.description}</p>
      <span className="mt-5 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-navy-900">
        바로가기
        <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  )
}

export function AdminFeaturePlaceholderPage() {
  const { pathname } = useLocation()
  const item = adminNavigation.find((navigation) => pathname === navigation.to)
  if (!item) return null

  return <FeaturePlaceholder item={item} />
}

export function AdminForbiddenPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24 text-center">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">ACCESS DENIED</p>
      <h1 className="mt-3 text-3xl font-semibold text-navy-900">관리자 권한이 필요합니다.</h1>
      <Link
        className="mt-7 inline-block rounded-sm bg-navy-900 px-6 py-3 text-xs tracking-[0.08em] text-white"
        to="/"
      >
        홈으로 돌아가기
      </Link>
    </main>
  )
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-7 border-b border-border-subtle pb-6">
      <p className="text-[11px] font-medium tracking-[0.16em] text-gold-500">ADMINISTRATION</p>
      <h2 className="mt-2 font-display text-[34px] leading-tight font-medium text-navy-900">
        {title}
      </h2>
      <p className="mt-2 text-sm text-ink-500">{description}</p>
    </header>
  )
}

function FeaturePlaceholder({ item }: { item: AdminNavigationItem }) {
  return (
    <>
      <PageHeading description={item.description} title={item.label} />
      <section
        aria-labelledby="admin-feature-preparing"
        className="rounded-lg border border-dashed border-border-subtle bg-white px-6 py-16 text-center"
      >
        <h3 className="text-lg font-medium text-navy-900" id="admin-feature-preparing">
          기능 준비 중
        </h3>
        <p className="mt-2 text-sm text-ink-500">
          이 화면의 세부 조회·등록·수정 기능은 다음 단계에서 연결합니다.
        </p>
        <p className="mt-5 text-xs text-ink-500/70">연결 예정 API: {item.endpoint}</p>
      </section>
    </>
  )
}
