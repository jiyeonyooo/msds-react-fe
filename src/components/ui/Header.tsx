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
  { label: 'RESERVATION', path: '/reservations' },
  { label: 'ABOUT', path: '/about' },
]

export function Header() {
  // 실제 로그인 세션이 우선이고, DEV 도구의 인증 상태 전환도 함께 인정한다.
  const session = useSession()
  const location = useLocation()
  const [devSignedIn, setDevSignedIn] = useState(isDevMode && getDevAuthState() === 'member')
  useEffect(() => {
    const update = () => setDevSignedIn(getDevAuthState() === 'member')
    addEventListener('msds-dev-auth', update)
    return () => removeEventListener('msds-dev-auth', update)
  }, [])
  const signedIn = session !== null || devSignedIn
  const action = signedIn
    ? { to: '/mypage', label: 'MY PAGE' }
    : { to: '/login', label: 'LOGIN' }
  return (
    <header className="relative z-40 h-[92px] border-b border-border-subtle bg-surface">
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[150px_1fr_auto] items-center px-5 md:px-16">
        <Logo />
        <nav className="hidden justify-self-center md:flex md:items-center md:gap-2" aria-label="주요 메뉴">
          <NavItem label={links[0].label} to={links[0].path} />
          <div className="group relative">
            <NavLink
              className={`flex items-center gap-1 border-b px-4 py-3 text-xs tracking-[0.14em] transition-colors ${location.pathname.startsWith('/rooms') || location.pathname.startsWith('/facility') ? 'border-gold-500 text-navy-900' : 'border-transparent text-secondary hover:border-gold-300'}`}
              to="/rooms"
              aria-haspopup="menu"
            >
              STAY <span className="text-[9px] transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden="true">⌄</span>
            </NavLink>
            <div className="invisible absolute top-full left-1/2 min-w-[170px] -translate-x-1/2 translate-y-2 border border-border-subtle bg-white py-2 opacity-0 shadow-floating transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100" role="menu">
              <NavLink className="block px-6 py-3 text-[11px] tracking-[0.14em] text-secondary transition-colors hover:bg-subtle hover:text-navy-900" to="/rooms" role="menuitem">ROOM</NavLink>
              <NavLink className="block px-6 py-3 text-[11px] tracking-[0.14em] text-secondary transition-colors hover:bg-subtle hover:text-navy-900" to="/facility" role="menuitem">FACILITY</NavLink>
            </div>
          </div>
          {links.slice(1).map((link) => <NavItem key={link.path} label={link.label} to={link.path} />)}
        </nav>
        <div className="flex items-center gap-3 justify-self-end">
          {session?.user && (
            <span className="hidden text-xs text-muted md:inline">{session.user.name}님</span>
          )}
          <NavLink
            className="rounded-sm bg-navy-900 px-4 py-3 text-xs font-medium tracking-[0.4px] text-white transition-opacity hover:opacity-80"
            to={action.to}
          >
            {action.label}
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
