import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getDevAuthState } from '../../dev/auth'
import { isDevMode } from '../../dev/scenarios'
import { signOut } from '../../features/auth/api'
import { useSession } from '../../features/auth/useSession'
import { Logo } from './Logo'
import { NavItem } from './NavItem'

const links = [
  { label: 'HOME', path: '/' },
  { label: 'PROGRAM', path: '/programs' },
  { label: 'WELLNESS', path: '/wellness' },
  { label: 'ABOUT', path: '/about' },
]

export function Header() {
  // 실제 로그인 세션이 우선이고, DEV 도구의 인증 상태 전환도 함께 인정한다.
  const session = useSession()
  const location = useLocation()
  const [devAuthState, setDevAuthState] = useState(() => (isDevMode ? getDevAuthState() : 'guest'))
  useEffect(() => {
    const update = () => setDevAuthState(getDevAuthState())
    addEventListener('msds-dev-auth', update)
    return () => removeEventListener('msds-dev-auth', update)
  }, [])
  // 조금이라도 내려가면 헤더 배경을 굳힌다. 히어로 위에 얹혀 있을 때는 투명에 가깝게 두어
  // 첫 화면의 사진을 가리지 않고, 스크롤이 시작되면 경계선과 그림자로 분리한다.
  const [lifted, setLifted] = useState(false)
  useEffect(() => {
    const update = () => setLifted(scrollY > 8)
    update()
    addEventListener('scroll', update, { passive: true })
    return () => removeEventListener('scroll', update)
  }, [])
  const signedIn = session !== null || devAuthState !== 'guest'
  const accountAction = signedIn
    ? {
        to: session?.user?.role === 'ADMIN' || devAuthState === 'admin' ? '/admin' : '/mypage',
        label: session?.user?.role === 'ADMIN' || devAuthState === 'admin' ? 'ADMIN' : 'MY PAGE',
      }
    : { to: '/login', label: 'LOGIN' }
  return (
    <header
      className={`sticky top-0 z-40 h-[92px] transition-[background-color,border-color,box-shadow] duration-500 ease-calm ${
        lifted
          ? 'border-b border-border-subtle bg-surface shadow-card'
          : 'border-b border-transparent bg-surface/85 backdrop-blur-sm'
      }`}
      id="top"
    >
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[150px_1fr_auto] items-center px-5 md:px-16">
        <Logo />
        <nav
          className="hidden justify-self-center md:flex md:items-center md:gap-2"
          aria-label="주요 메뉴"
        >
          <NavItem label={links[0].label} to={links[0].path} />
          <div className="group relative">
            <NavLink
              className={`flex items-center gap-1.5 border-b px-4 py-3 text-xs tracking-[0.14em] transition-colors ${location.pathname.startsWith('/rooms') || location.pathname.startsWith('/facility') ? 'border-gold-500 text-navy-900' : 'border-transparent text-secondary hover:border-gold-300'}`}
              to="/rooms"
              aria-haspopup="menu"
            >
              STAY{' '}
              <svg
                aria-hidden="true"
                className="h-1.5 w-2.5 shrink-0 translate-y-0.5px transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="0.75"
                viewBox="0 0 10 6"
              >
                <path d="m1 1 4 4 4-4" />
              </svg>
            </NavLink>
            <div
              className="invisible absolute top-full left-1/2 min-w-[170px] -translate-x-1/2 translate-y-2 border border-border-subtle bg-white py-2 opacity-0 shadow-floating transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
              role="menu"
            >
              <NavLink
                className="block px-6 py-3 text-[11px] tracking-[0.14em] text-secondary transition-colors hover:bg-subtle hover:text-navy-900"
                to="/rooms"
                role="menuitem"
              >
                ROOM
              </NavLink>
              <NavLink
                className="block px-6 py-3 text-[11px] tracking-[0.14em] text-secondary transition-colors hover:bg-subtle hover:text-navy-900"
                to="/facility"
                role="menuitem"
              >
                FACILITY
              </NavLink>
            </div>
          </div>
          {links.slice(1).map((link) => (
            <NavItem key={link.path} label={link.label} to={link.path} />
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {session?.user && (
            <span className="hidden text-xs text-muted md:inline">{session.user.name}님</span>
          )}
          <NavLink
            className="hidden text-[10px] tracking-[0.1em] text-ink-500 hover:text-navy-900 lg:block"
            to={accountAction.to}
          >
            {accountAction.label}
          </NavLink>
          <NavLink
            className="rounded-sm bg-navy-900 px-5 py-3 text-xs font-medium tracking-[0.4px] text-white transition-opacity hover:opacity-80"
            to="/reservations"
          >
            BOOK NOW
          </NavLink>
          {session && (
            <button
              className="border-0 bg-transparent p-0 text-[0.625rem] tracking-[0.06em] text-muted md:text-xs"
              onClick={() => void signOut()}
              type="button"
            >
              LOGOUT
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
