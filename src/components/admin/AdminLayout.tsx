import { NavLink, Outlet } from 'react-router-dom'
import { Logo } from '../ui'
import { useSession } from '../../features/auth/useSession'

const navigation = [
  { label: '대시보드', to: '/admin' },
  { label: '프로그램 관리', to: '/admin/programs' },
]

export function AdminLayout() {
  const session = useSession()

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-6 text-center">
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
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-6 text-center">
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

  return (
    <div className="min-h-screen bg-[#f4f1ea] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-navy-900 px-7 py-8 text-white lg:sticky lg:top-0 lg:h-screen">
        <Logo inverse />
        <p className="mt-4 text-[10px] tracking-[0.22em] text-white/55">ADMIN CONSOLE</p>
        <nav
          className="mt-10 flex gap-2 overflow-x-auto lg:block lg:space-y-2"
          aria-label="관리자 메뉴"
        >
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `block shrink-0 border-l-2 px-4 py-3 text-xs tracking-[0.08em] transition ${
                  isActive
                    ? 'border-gold-500 bg-white/10 text-white'
                    : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
              end={item.to === '/admin'}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-white/15 pt-6 text-[11px] leading-5 text-white/55 lg:absolute lg:right-7 lg:bottom-8 lg:left-7">
          <p>{session.user.name}</p>
          <p>{session.user.email}</p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b border-[#d8d0c2] bg-[#fbfaf6] px-6 lg:px-10">
          <p className="text-[11px] font-medium tracking-[0.15em] text-gold-500">MSDS OPERATIONS</p>
          <NavLink className="text-[11px] text-ink-500 hover:text-navy-900" to="/">
            사이트로 돌아가기 →
          </NavLink>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
