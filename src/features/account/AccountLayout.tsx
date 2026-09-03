import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/ui'
import { signOut } from '../auth/api'

const menu = [
  { label: '회원정보', to: '/mypage', end: false },
  { label: '문의 내역', to: '/inquiries', end: false },
  { label: '마음 기록', to: '/mypage/wellness', end: false },
]

type AccountLayoutProps = {
  eyebrow: string
  title: string
  description: string
  hero?: ReactNode
  children: ReactNode
}

/**
 * 마이페이지·정보 수정·회원 탈퇴·문의가 공유하는 화면 뼈대.
 * 위쪽 네이비 히어로와 왼쪽 계정 사이드바, 오른쪽 본문으로 구성한다.
 */
export function AccountLayout({ eyebrow, title, description, hero, children }: AccountLayoutProps) {
  const navigate = useNavigate()
  return (
    <div>
      <section className="flex flex-col gap-8 bg-navy-900 px-6 py-12 lg:flex-row lg:items-start lg:gap-16 lg:px-[100px] lg:pt-[68px] lg:pb-[58px]">
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-xs font-medium tracking-[0.18em] text-gold-500">{eyebrow}</p>
          <h1 className="font-display text-[36px] leading-[1.27] font-medium tracking-[-0.01em] text-white lg:text-[44px]">
            {title}
          </h1>
          <p className="max-w-[620px] text-[15px] leading-[26px] text-white/[0.72]">
            {description}
          </p>
        </div>
        {hero}
      </section>
      <section className="flex flex-col gap-8 bg-canvas px-6 py-12 lg:flex-row lg:items-start lg:px-[100px] lg:pt-16 lg:pb-[72px]">
        <aside className="w-full rounded-xl border border-border-subtle bg-white px-[30px] py-7 lg:w-[280px] lg:shrink-0">
          <div className="flex justify-center">
            <Logo />
          </div>
          <span className="mt-6 block h-px w-full bg-border-subtle" />
          <nav aria-label="계정 메뉴" className="grid gap-1 pt-5">
            {menu.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `flex h-12 items-center gap-3 rounded-md text-sm transition ${
                    isActive
                      ? 'bg-subtle pr-4 pl-[14px] font-medium text-navy-900'
                      : 'px-4 text-secondary hover:bg-subtle/60'
                  }`
                }
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="h-5 w-0.5 bg-gold-500" />}
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <button
            className="mt-1 flex h-12 w-full items-center px-4 text-left text-sm text-secondary transition hover:bg-subtle/60"
            onClick={() => void signOut().then(() => navigate('/'))}
            type="button"
          >
            로그아웃
          </button>
          <div className="grid gap-2 pt-[18px]">
            <p className="text-[10px] font-medium tracking-[0.12em] text-gold-500">
              PRIVATE &amp; MINDFUL
            </p>
            <p className="text-xs leading-5 text-muted">
              마음 기록은 의료 진단이 아닌 개인 웰니스 기록으로 관리됩니다.
            </p>
          </div>
        </aside>
        <div className="flex w-full flex-1 flex-col gap-6">{children}</div>
      </section>
    </div>
  )
}

// 네이비 히어로 위에 놓는 흰 알약형 이동 버튼. 어두운 배경에서도 대비가 유지된다.
export function HeroAction({ badge, label, to }: { badge: string; label: string; to: string }) {
  return (
    <Link
      className="flex h-[58px] w-full items-center justify-center gap-3 rounded-md bg-white px-5 transition hover:bg-ivory-100 lg:w-[306px]"
      to={to}
    >
      <span className="text-[10px] font-medium tracking-[0.1em] text-gold-500">{badge}</span>
      <span className="text-[13px] font-medium text-navy-900">{label}</span>
    </Link>
  )
}

// 정보 수정·탈퇴 화면 히어로 오른쪽에 두는 마이페이지 복귀 버튼.
export function BackToMyPage() {
  return <HeroAction badge="BACK" label="마이페이지로 돌아가기" to="/mypage" />
}
