import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { signOut } from '../../features/auth/api'
import { useSession } from '../../features/auth/useSession'
import { Logo } from '../ui'

const navigation = [
  { label: '대시보드', to: '/admin' },
  { label: '고객 관리', to: '/admin/members' },
  { label: '문의 관리', to: '/admin/inquiries' },
  { label: '객실 관리', to: '/admin/rooms' },
  { label: '시설 관리', to: '/admin/facilities' },
  { label: '프로그램 관리', to: '/admin/programs' },
  { label: '웰니스 통계', to: '/admin/wellness' },
  { label: '조용함 관리', to: '/admin/quietness' },
] as const

function sectionTitle(pathname: string) {
  if (pathname.includes('/inquiries/')) return '문의 상세'
  if (pathname.startsWith('/admin/inquiries')) return '문의 관리'
  if (pathname.includes('/members/')) return '회원 상세'
  if (pathname.startsWith('/admin/members')) return '고객 관리'
  if (pathname.startsWith('/admin/rooms')) return '객실 관리'
  if (pathname.startsWith('/admin/facilities')) return '시설 관리'
  if (pathname.startsWith('/admin/programs')) return '프로그램 관리'
  if (pathname.startsWith('/admin/wellness')) return '웰니스 통계'
  if (pathname.startsWith('/admin/quietness')) return '조용함 관리'
  return '대시보드'
}

export function AdminLayout() {
  const session = useSession()
  const location = useLocation()

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-subtle px-6 text-center">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-gold-500">ADMIN ACCESS</p>
          <h1 className="mt-4 font-display text-4xl font-semibold">로그인이 필요합니다.</h1>
          <NavLink
            className="mt-7 inline-block bg-navy-900 px-7 py-3 text-xs text-white"
            to="/login"
          >
            로그인하기
          </NavLink>
        </div>
      </main>
    )
  }

  if (session.user?.role !== 'ADMIN') {
    return (
      <main className="grid min-h-screen place-items-center bg-subtle px-6 text-center">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-gold-500">ACCESS DENIED</p>
          <h1 className="mt-4 font-display text-4xl font-semibold">관리자만 접근할 수 있습니다.</h1>
          <NavLink className="mt-7 inline-block border-b border-navy-900 pb-1 text-xs" to="/">
            홈으로 돌아가기
          </NavLink>
        </div>
      </main>
    )
  }

  const initial = session.user.name.trim().charAt(0).toUpperCase() || 'A'

  return (
    <div className="min-h-screen bg-subtle lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="bg-navy-900 px-5 py-7 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex h-[142px] items-center justify-center overflow-hidden">
          <Logo inverse />
        </div>
        <nav
          className="mt-5 flex gap-2 overflow-x-auto lg:mt-0 lg:block lg:space-y-2"
          aria-label="관리자 메뉴"
        >
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `block h-12 shrink-0 rounded-sm border-l-2 px-4 py-[13px] text-sm transition ${isActive ? 'border-gold-500 bg-white text-navy-900' : 'border-transparent text-white hover:bg-white/5'}`
              }
              end={item.to === '/admin'}
              key={item.label}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
          <button
            className="block h-12 w-full border-l-2 border-transparent px-4 text-left text-sm text-white hover:bg-white/5"
            onClick={() => void signOut()}
            type="button"
          >
            로그아웃
          </button>
        </nav>
        <div className="mt-8 border-t border-gold-300/60 pt-4 text-[11px] leading-5 lg:mt-auto">
          <p className="text-[9px] font-medium tracking-[0.16em] text-gold-500">ADMINISTRATOR</p>
          <p className="mt-2 text-white/85">{session.user.email}</p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-20 items-center justify-between border-b border-border-subtle bg-white px-6 lg:px-12">
          <div>
            <p className="text-[10px] font-medium tracking-[0.16em] text-gold-500">MSDS ADMIN</p>
            <p className="mt-1 text-sm font-medium text-navy-900">
              {sectionTitle(location.pathname)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-[34px] place-items-center rounded-full bg-navy-900 text-xs font-medium text-white">
              {initial}
            </span>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-navy-900">{session.user.name}</p>
              <p className="mt-0.5 text-[10px] text-ink-700">{session.user.email}</p>
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
