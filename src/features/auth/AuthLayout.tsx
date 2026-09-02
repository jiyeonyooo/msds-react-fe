import type { ReactNode } from 'react'
import { Logo } from '../../components/ui'

type AuthLayoutProps = {
  story: { eyebrow: string; title: ReactNode; body: string; quote: string }
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * 로그인·회원가입이 공유하는 좌우 2단 화면.
 * 왼쪽은 네이비 브랜드 스토리, 오른쪽은 아이보리 배경 위의 흰 폼 카드다.
 */
export function AuthLayout({
  story,
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-[860px] flex-col lg:flex-row">
      <section className="relative isolate flex w-full flex-col gap-lg overflow-hidden bg-navy-900 px-8 py-14 lg:w-1/2 lg:px-[84px] lg:pt-20 lg:pb-[72px]">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-160px] bottom-[-160px] z-0 h-[520px] w-[520px] rounded-full bg-navy-700/70"
        />
        <div className="relative z-10 flex h-full flex-col gap-lg">
          <Logo inverse />
          <p className="text-xs font-medium tracking-[0.18em] text-gold-500">{story.eyebrow}</p>
          <h1 className="font-display text-[56px] leading-[1.06] font-medium text-white lg:text-[72px]">
            {story.title}
          </h1>
          <p className="max-w-[500px] text-base leading-[29px] text-white/[0.82]">{story.body}</p>
          <div className="mt-auto flex max-w-[500px] flex-col gap-md pt-10">
            <span className="h-px w-16 bg-gold-500" />
            <p className="text-[15px] leading-[26px] text-white/[0.78]">{story.quote}</p>
          </div>
        </div>
      </section>
      <section className="flex w-full items-center justify-center bg-canvas px-6 py-14 lg:w-1/2">
        <div className="flex w-full max-w-[520px] flex-col items-center gap-lg rounded-lg bg-white px-6 py-10 shadow-floating sm:px-[50px] sm:py-[42px]">
          <Logo />
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">{eyebrow}</p>
            <h2 className="font-display text-[42px] leading-[48px] font-medium text-navy-900">
              {title}
            </h2>
            <p className="text-sm text-secondary">{description}</p>
          </div>
          <div className="w-full">{children}</div>
          {footer && (
            <>
              <span className="h-px w-full bg-border-subtle" />
              <div className="text-sm text-secondary">{footer}</div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
