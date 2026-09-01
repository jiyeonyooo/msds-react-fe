import type { ReactNode } from 'react'

type AuthLayoutProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

// 로그인/회원가입이 공유하는 화면 뼈대. 한 열 폼 카드 위에 안내 문구를 둔다.
export function AuthLayout({ eyebrow, title, description, children, footer }: AuthLayoutProps) {
  return (
    <main className="mx-auto w-full max-w-[520px] px-6 pt-[58px] pb-[110px] md:pt-[90px]">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">{eyebrow}</p>
      <h1 className="my-2.5 font-display text-[52px] leading-[0.95] tracking-[-0.125rem]">
        {title}
      </h1>
      <p className="text-sm text-muted">{description}</p>
      <div className="mt-[38px] border border-border-subtle bg-white p-[26px] shadow-card">
        {children}
      </div>
      {footer && <div className="mt-6 text-center text-[13px] text-muted">{footer}</div>}
    </main>
  )
}
