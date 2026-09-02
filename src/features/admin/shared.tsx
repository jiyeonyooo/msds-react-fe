import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

export const inputClass =
  'mt-2 min-h-11 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#b79a67] focus:ring-2 focus:ring-[#b79a67]/20 disabled:bg-slate-100'

const pageDescriptions: Record<string, string> = {
  '객실 관리': '객실 정보와 판매 상태를 확인하고 등록·수정합니다.',
  '객실 등록': '새 객실의 기본 정보, 수용 인원과 가격을 등록합니다.',
  '객실 수정': '등록된 객실의 정보와 판매 상태를 변경합니다.',
  '편의시설 관리': '편의시설의 노출 상태와 상세 정보를 관리합니다.',
  '편의시설 등록': '새 편의시설의 정보와 노출 상태를 등록합니다.',
  '편의시설 수정': '등록된 편의시설의 정보와 노출 상태를 변경합니다.',
}

export function AdminPageHeader({
  title,
  action,
}: {
  eyebrow: string
  title: string
  action?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-300 pb-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#a77f3b]">ADMINISTRATION</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#172b44]">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{pageDescriptions[title]}</p>
      </div>
      {action}
    </header>
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
  return (
    <div
      className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-600"
      role="status"
    >
      불러오는 중입니다…
    </div>
  )
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
