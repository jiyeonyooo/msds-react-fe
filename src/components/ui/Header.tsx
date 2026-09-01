import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getDevAuthState } from '../../dev/auth'
import { isDevMode } from '../../dev/scenarios'
import { signOut } from '../../features/auth/api'
import { useSession } from '../../features/auth/useSession'
import { Logo } from './Logo'
import { NavItem } from './NavItem'

const links = [
  { label: 'HOME', path: '/' },
  { label: 'ROOMS', path: '/rooms' },
  { label: 'RESERVATION', path: '/my-reservations' },
  { label: 'PROGRAM', path: '/programs' },
  { label: 'WELLNESS', path: '/wellness' },
  { label: 'ABOUT', path: '/about' },
]

export function Header() {
  // 실제 로그인 세션이 우선이고, DEV 도구의 인증 상태 전환도 함께 인정한다.
  const session = useSession()
  const [devSignedIn, setDevSignedIn] = useState(isDevMode && getDevAuthState() === 'member')
  useEffect(() => {
    const update = () => setDevSignedIn(getDevAuthState() === 'member')
    addEventListener('msds-dev-auth', update)
    return () => removeEventListener('msds-dev-auth', update)
  }, [])
  const signedIn = session !== null || devSignedIn
  const action = signedIn
    ? { to: '/my-reservations', label: 'MY PAGE' }
    : { to: '/login', label: 'LOGIN' }
  return (
    <header className="h-[92px] border-b border-border-subtle bg-surface">
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[150px_1fr_auto] items-center px-5 md:px-16">
        <Logo />
        <nav className="hidden justify-self-center md:flex md:items-center md:gap-2" aria-label="주요 메뉴">
          {links.map((link) => (
            <NavItem key={link.path} label={link.label} to={link.path} />
          ))}
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