import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

export const inputClass =
  'mt-2 min-h-11 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#b79a67] focus:ring-2 focus:ring-[#b79a67]/20 disabled:bg-slate-100'

/**
 * 관리자 화면의 글자 크기 기준.
 *
 * 메뉴마다 제목이 text-3xl · font-display text-4xl · text-[42px] · text-[32px] 로 제각각이었고
 * 소제목도 text-lg · text-[17px] · text-2xl 이 섞여 있었다. 기준은 회원 관리 화면의 글꼴이며,
 * 값을 여기 한 곳에 두어 화면이 늘어나도 다시 갈라지지 않게 한다.
 */
export const adminHeadingClass = 'text-3xl font-semibold tracking-tight text-[#172b44]'
export const adminSectionTitleClass = 'text-lg font-semibold tracking-tight text-[#172b44]'
export const adminPanelTitleClass = 'text-sm font-semibold text-[#172b44]'
export const adminEyebrowClass = 'text-[11px] font-semibold tracking-[0.16em] text-[#a77f3b]'
export const adminMetaClass = 'text-xs text-slate-600'

const pageDescriptions: Record<string, string> = {
  '객실 관리': '객실 정보와 판매 상태를 확인하고 등록·수정합니다.',
  '객실 등록': '새 객실의 기본 정보, 수용 인원과 가격을 등록합니다.',
  '객실 수정': '등록된 객실의 정보와 판매 상태를 변경합니다.',
  '편의시설 관리': '편의시설의 노출 상태와 상세 정보를 관리합니다.',
  '편의시설 등록': '새 편의시설의 정보와 노출 상태를 등록합니다.',
  '편의시설 수정': '등록된 편의시설의 정보와 노출 상태를 변경합니다.',
}

/**
 * 관리자 화면의 유일한 페이지 머리말.
 *
 * 글꼴은 회원 관리 화면을, 머리말과 본문 사이 간격은 예약 관리 화면(mb-5 / pb-6)을 기준으로 맞췄다.
 * 화면마다 mt-5 가 붙거나 붙지 않아 첫 카드까지의 거리가 달라지던 문제를 여기서 끝낸다.
 */
export function AdminPageHeading({
  eyebrow = 'ADMINISTRATION',
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-slate-300 pb-6">
      <div>
        <p className={adminEyebrowClass}>{eyebrow}</p>
        <h1 className={`mt-2 ${adminHeadingClass}`}>{title}</h1>
        {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-3">{action}</div>}
    </header>
  )
}

/** 제목만 넘기면 설명을 표에서 찾아 채우는 객실·편의시설용 머리말. */
export function AdminPageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string
  title: string
  action?: ReactNode
}) {
  return (
    <AdminPageHeading
      action={action}
      description={pageDescriptions[title]}
      eyebrow={eyebrow}
      title={title}
    />
  )
}

/** 화면 위쪽에 나란히 놓이는 숫자 요약 칸. */
export function AdminSummaryCard({
  label,
  value,
  unit,
  emphasis = false,
  caption,
}: {
  label: string
  value: ReactNode
  unit?: string
  emphasis?: boolean
  caption?: string
}) {
  return (
    <div
      className={`rounded-lg border bg-white px-5 py-4 shadow-sm ${emphasis ? 'border-[#d7c59e]' : 'border-slate-200'}`}
    >
      <p className="text-[11px] font-medium tracking-[0.12em] text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${emphasis ? 'text-[#a77f3b]' : 'text-[#172b44]'}`}
      >
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-500">{unit}</span>}
      </p>
      {caption && <p className="mt-2 text-[11px] leading-4 text-slate-500">{caption}</p>}
    </div>
  )
}

/** 회색 머리를 가진 흰 카드. 관리자 화면의 모든 묶음이 이 형태를 쓴다. */
export function AdminPanel({
  title,
  meta,
  action,
  children,
  bodyClass = 'p-6',
}: {
  title: string
  meta?: ReactNode
  action?: ReactNode
  children: ReactNode
  bodyClass?: string
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className={adminPanelTitleClass}>{title}</h2>
        {meta && <span className={adminMetaClass}>{meta}</span>}
        {action}
      </header>
      <div className={bodyClass}>{children}</div>
    </article>
  )
}

/** 결과가 없거나 아직 연결되지 않은 자리를 채우는 안내 상자. */
export function AdminEmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-600"
      role="status"
    >
      {children}
    </div>
  )
}

export function PrimaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center rounded-sm bg-[#172b44] px-5 text-sm font-medium text-white transition hover:bg-[#253f5d]"
      to={to}
    >
      {children}
    </Link>
  )
}

export function RoomFacilityTabs() {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-medium transition ${isActive ? 'border-[#172b44] text-[#172b44]' : 'border-transparent text-slate-500 hover:text-[#172b44]'}`
  return (
    <nav className="mb-6 flex gap-1 border-b border-slate-300" aria-label="객실 및 편의시설 관리">
      <NavLink className={tabClass} to="/admin/rooms">
        객실 관리
      </NavLink>
      <NavLink className={tabClass} to="/admin/facilities">
        편의시설 관리
      </NavLink>
    </nav>
  )
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div
      className={`mb-5 rounded-lg border px-4 py-3 text-sm ${error ? 'border-[#ead8d2] bg-[#fffaf8] text-error' : 'border-[#e5d7b8] bg-[#fffaf0] text-slate-700'}`}
      role={error ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}

export function LoadingState() {
  return <AdminEmptyState>불러오는 중입니다…</AdminEmptyState>
}

export function AdminField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span>
        {label}
        {required && <span className="ml-1 text-error">필수</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-error" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

export function ImageThumb({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <div className="h-16 w-24 overflow-hidden rounded-sm border border-slate-200 bg-slate-100">
      {src ? (
        <img
          className="h-full w-full object-cover"
          src={src}
          alt={alt}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <span className="grid h-full place-items-center text-[10px] text-slate-400">NO IMAGE</span>
      )}
    </div>
  )
}
