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

/** 헤더 우측 버튼 한 쌍(로그인·예약)이 공유하는 크기와 모양. */
const accountButtonClass =
  'inline-flex min-h-[44px] items-center justify-center rounded-sm px-3.5 py-3 text-[11px] font-medium tracking-[0.4px] whitespace-nowrap transition-colors md:px-5 md:text-xs'

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
  // 아바타에 쓸 이름 첫 글자. 이름이 비어 있어도 원이 빈 채로 남지 않게 기본값을 둔다.
  const initial = session?.user?.name?.trim().charAt(0).toUpperCase() || 'M'
  return (
    <header
      className={`sticky top-0 z-40 h-[92px] transition-[background-color,border-color,box-shadow] duration-500 ease-calm ${
        lifted
          ? 'border-b border-border-subtle bg-surface shadow-card'
          : 'border-b border-transparent bg-surface/85 backdrop-blur-sm'
      }`}
      id="top"
    >
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[150px_1fr_auto] items-center px-5 lg:px-16">
        <Logo />
        <nav
          className="hidden justify-self-center md:flex md:items-center md:gap-0 lg:gap-2"
          aria-label="주요 메뉴"
        >
          <NavItem label={links[0].label} to={links[0].path} />
          <div className="group relative">
            <NavLink
              className={`flex items-center gap-1.5 border-b px-2 py-3 text-xs tracking-[0.14em] transition-colors lg:px-4 ${location.pathname.startsWith('/rooms') || location.pathname.startsWith('/facility') ? 'border-gold-500 text-navy-900' : 'border-transparent text-secondary hover:border-gold-300'}`}
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
        <div className="flex items-center gap-2 md:gap-3">
          {session?.user && (
            // 이름만 흐린 글자로 두면 헤더에서 아무 무게도 갖지 못한다.
            // 이니셜 원을 붙여 한 덩어리로 묶고, 전체 이메일은 툴팁으로 넘긴다.
            <span
              className="hidden items-center gap-2 lg:flex"
              title={`${session.user.name}님 · ${session.user.email}`}
            >
              <span
                aria-hidden="true"
                className="grid size-[30px] shrink-0 place-items-center rounded-full bg-subtle text-[11px] font-medium text-navy-900 ring-1 ring-gold-300"
              >
                {initial}
              </span>
              <span className="hidden text-xs whitespace-nowrap text-secondary xl:inline">
                {session.user.name}님
              </span>
            </span>
          )}
          {/*
            로그인(마이페이지·관리자)은 예약 버튼과 한 쌍으로 읽혀야 하므로 같은 높이·같은
            글자 크기의 외곽선 버튼으로 둔다. 이전에는 10px 텍스트 링크였던 데다 lg 미만에서
            숨겨져 있어, 태블릿 폭에서는 로그인으로 갈 방법이 아예 없었다.
          */}
          <NavLink
            className={`${accountButtonClass} border border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white`}
            to={accountAction.to}
          >
            {accountAction.label}
          </NavLink>
          <NavLink
            className={`${accountButtonClass} bg-navy-900 text-white hover:bg-navy-700`}
            to="/reservations"
          >
            BOOK NOW
          </NavLink>
          {session && (
            <button
              aria-label="로그아웃"
              className="hidden size-11 shrink-0 place-items-center rounded-sm border border-border-accent bg-transparent text-secondary transition-colors hover:border-navy-900 hover:text-navy-900 lg:grid"
              onClick={() => void signOut()}
              title="로그아웃"
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.25"
                viewBox="0 0 16 16"
              >
                <path d="M6.25 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2h2.75" />
                <path d="m10.75 11 3-3-3-3" />
                <path d="M13.75 8H6.25" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
