import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getDevAuthState } from '../../dev/auth'
import { isDevMode } from '../../dev/scenarios'
import { Logo } from './Logo'
import { NavItem } from './NavItem'

const links = [
  { label: 'HOME', path: '/' },
  { label: 'ROOMS', path: '/reservations' },
  { label: 'RESERVATION', path: '/my-reservations' },
  { label: 'PROGRAM', path: '/programs' },
  { label: 'WELLNESS', path: '/wellness' },
  { label: 'ABOUT', path: '/about' },
]

export function Header() {
  const [signedIn, setSignedIn] = useState(isDevMode && getDevAuthState() === 'member')
  useEffect(() => {
    const update = () => setSignedIn(getDevAuthState() === 'member')
    addEventListener('msds-dev-auth', update)
    return () => removeEventListener('msds-dev-auth', update)
  }, [])
  const action = signedIn ? { to: '/my-reservations', label: 'MY PAGE' } : { to: '/login', label: 'LOGIN' }
  return <header className="h-[92px] border-b border-border-subtle bg-surface"><div className="mx-auto grid h-full max-w-[1440px] grid-cols-[150px_1fr_150px] items-center px-5 md:px-16"><Logo /><nav className="hidden justify-self-center md:flex md:items-center md:gap-2" aria-label="주요 메뉴">{links.map((link) => <NavItem key={link.path} label={link.label} to={link.path} />)}</nav><NavLink className="justify-self-end rounded-sm bg-navy-900 px-4 py-3 text-xs font-medium tracking-[0.4px] text-white transition-opacity hover:opacity-80" to={action.to}>{action.label}</NavLink></div></header>
}
