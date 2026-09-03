import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import wordmarkDark from '../../assets/ui/wordmark-dark.svg'
import { getDevAuthState } from '../../dev/auth'
import { isDevMode } from '../../dev/scenarios'
import { signOut } from '../auth/api'
import { useSession } from '../auth/useSession'
import { adminNavigation } from './adminNavigation'

const menu = [{ to: '/admin', label: '대시보드' }, ...adminNavigation.map(({ to, label }) => ({ to, label }))]

function AccessNotice({ eyebrow, title, action }: { eyebrow: string; title: string; action: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-subtle px-6 text-center">
      <div>
        <p className="text-[11px] font-medium tracking-[0.18em] text-gold-500">{eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-semibold">{title}</h1>
        {action}
      </div>
    </main>
  )
}

/**
 * 관리자 화면의 단일 공용 레이아웃.
 *
 * 메뉴는 상단 가로 바에 둔다. 이전 구현은 가운데 정렬을 absolute + translate로 잡아
 * 폭이 좁아지면 로고·우측 버튼과 겹쳐 글자가 잘렸다. 여기서는 평범한 flex 3단으로 두고
 * 메뉴에만 남는 폭을 주어(min-w-0 + overflow-x-auto), 좁아지면 겹치는 대신 가로로 스크롤된다.
 *
 * 본문 여백도 이 레이아웃이 책임진다. 개별 관리자 페이지는 자체 패딩을 갖고 있지 않아
 * 여기서 감싸주지 않으면 화면 가장자리에 그대로 붙는다.
 */
export function AdminLayout() {
  const session = useSession()
  const navigate = useNavigate()
  const devAdmin = isDevMode && getDevAuthState() === 'admin'

  if (!session && !devAdmin) {
    return (
      <AccessNotice
        action={
          <NavLink className="mt-7 inline-block bg-navy-900 px-7 py-3 text-xs text-white" to="/login">
            로그인하기
          </NavLink>
        }
        eyebrow="ADMIN ACCESS"
        title="로그인이 필요합니다."
      />
    )
  }

  if (!devAdmin && session?.user?.role !== 'ADMIN') {
    return (
      <AccessNotice
        action={
          <NavLink className="mt-7 inline-block border-b border-navy-900 pb-1 text-xs" to="/">
            홈으로 돌아가기
          </NavLink>
        }
        eyebrow="ACCESS DENIED"
        title="관리자만 접근할 수 있습니다."
      />
    )
  }

  const adminName = session?.user?.name ?? 'MSDS 관리자'
  const adminEmail = session?.user?.email ?? 'admin@msds.com'
  const initial = adminName.trim().charAt(0).toUpperCase() || 'A'

  return (
    <div className="min-h-screen bg-subtle">
      <header className="border-b border-navy-700 bg-navy-900 text-white">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-6 px-5 md:px-10">
          <Link aria-label="관리자 대시보드로" className="grid w-[104px] shrink-0 gap-0.5 no-underline" to="/admin">
            <img alt="MSDS" className="w-full pb-1" src={wordmarkDark} />
            <span className="h-px w-full bg-gold-500" />
            <span className="text-center text-[9px] font-medium tracking-[0.42em] text-gold-500">ADMIN</span>
          </Link>

          <nav aria-label="관리자 메뉴" className="min-w-0 flex-1 overflow-x-auto">
            <ul className="flex min-w-max items-center gap-0.5">
              {menu.map((item) => (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      `block whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium tracking-[0.02em] transition-colors ${isActive ? 'border-gold-500 text-white' : 'border-transparent text-white/70 hover:border-white/30 hover:text-white'}`
                    }
                    end={item.to === '/admin'}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2.5 xl:flex">
              <span className="grid size-[34px] place-items-center rounded-full bg-white/10 text-xs font-medium text-white">
                {initial}
              </span>
              <div className="leading-tight">
                <p className="text-xs font-medium text-white">{adminName}</p>
                <p className="mt-0.5 text-[10px] text-white/60">{adminEmail}</p>
              </div>
            </div>
            <Link
              className="rounded-sm bg-white px-4 py-2.5 text-[11px] font-medium tracking-[0.06em] text-navy-900 transition-colors hover:bg-white/80"
              to="/"
            >
              HOME
            </Link>
            <button
              className="rounded-sm border border-white/35 px-3 py-2.5 text-[11px] font-medium text-white/85 transition-colors hover:border-white hover:text-white"
              onClick={() => void signOut().finally(() => navigate('/'))}
              type="button"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-10 md:py-10">
        <Outlet />
      </section>
    </div>
  )
}
