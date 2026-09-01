import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { getDevAuthState } from '../dev/auth'
import { isDevMode } from '../dev/scenarios'

const links = [
  { label: 'HOME', path: '/' },
  { label: 'STAY', path: '/reservations' },
  { label: 'PROGRAM', path: '/programs' },
  { label: 'WELLNESS', path: '/wellness' },
  { label: 'ABOUT', path: '/about' },
]
export function AppLayout() {
  const [signedIn, setSignedIn] = useState(isDevMode && getDevAuthState() === 'member')
  useEffect(() => {
    const update = () => setSignedIn(getDevAuthState() === 'member')
    addEventListener('msds-dev-auth', update)
    return () => removeEventListener('msds-dev-auth', update)
  }, [])
  const action = signedIn
    ? { to: '/my-reservations', label: 'MY RESERVATION' }
    : { to: '/login', label: 'LOGIN' }
  return (
    <div className="min-h-screen">
      <header className="h-18 border-b border-border-subtle bg-surface md:h-24">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-12">
          <NavLink
            className="font-display text-4xl leading-none tracking-[-0.125rem] text-navy-900 md:text-[2.75rem]"
            to="/"
            aria-label="MSDS 홈으로"
          >
            <span className="mr-2 text-[1.625rem] text-gold-500">☾</span>MSDS
          </NavLink>
          <nav className="hidden gap-5 md:flex" aria-label="주요 메뉴">
            {links.map((link) => (
              <NavLink
                key={link.path}
                className={({ isActive }) =>
                  `border-b px-4 py-3 text-xs tracking-[0.14em] ${isActive ? 'border-gold-500' : 'border-transparent'}`
                }
                to={link.path}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <NavLink
            className="rounded-sm bg-navy-900 px-3 py-2.5 text-[0.625rem] tracking-[0.06em] text-white transition hover:bg-navy-700 md:px-6 md:py-3 md:text-xs"
            to={action.to}
          >
            {action.label}
          </NavLink>
        </div>
      </header>
      <Outlet />
      <footer className="bg-navy-900 px-6 py-13 text-white md:px-[max(3rem,calc((100vw-70rem)/2))]">
        <strong className="font-display text-3xl font-medium">☾ MSDS</strong>
        <p className="mt-3 text-xs tracking-[0.08em] text-[#c8d0d7]">MINDFUL STAY, DEEP SILENCE</p>
        <small className="mt-2 block text-xs tracking-[0.08em] text-[#c8d0d7]">
          기능별 구현은 <code>src/features</code>에서 이어가고 있습니다.
        </small>
      </footer>
    </div>
  )
}
