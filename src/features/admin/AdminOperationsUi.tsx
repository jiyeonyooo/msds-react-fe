import type { ReactNode } from 'react'

export function AdminPageIntro({
  eyebrow,
  title,
  description,
  badgeTitle,
  badgeDescription,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  badgeTitle: string
  badgeDescription: string
  action?: ReactNode
}) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-5 border-b border-[#d7c59e] pb-6 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-[10px] font-medium tracking-[0.22em] text-gold-500">{eyebrow}</p>
        <h1 className="m-0 text-[27px] font-medium tracking-[-0.04em] text-navy-900">{title}</h1>
        <p className="mt-2 text-xs leading-6 text-ink-500">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {action}
        <div className="min-w-[178px] rounded-md border border-gold-300 bg-white px-4 py-3">
          <p className="text-[9px] font-medium tracking-[0.15em] text-gold-500">{badgeTitle}</p>
          <p className="mt-1 text-[10px] text-ink-500">{badgeDescription}</p>
        </div>
      </div>
    </header>
  )
}

export function AdminSummaryGrid({
  items,
}: {
  items: { label: string; value: number | string; note: string }[]
}) {
  return (
    <section className="mb-5 grid overflow-hidden rounded-lg border border-ivory-200 bg-white md:grid-cols-3">
      {items.map((item, index) => (
        <article
          className={`px-6 py-5 ${index > 0 ? 'border-t border-ivory-200 md:border-t-0 md:border-l' : ''}`}
          key={item.label}
        >
          <p className="text-[10px] text-ink-500">{item.label}</p>
          <div className="mt-1 flex items-end gap-3">
            <strong className="text-2xl font-medium text-navy-900">{item.value}</strong>
            <span className="pb-0.5 text-[9px] text-gold-500">{item.note}</span>
          </div>
        </article>
      ))}
    </section>
  )
}

export function AdminPanel({
  title,
  endpoint,
  action,
  children,
  className = '',
}: {
  title: string
  endpoint: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-lg border border-ivory-200 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(14,34,57,.2)] ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-ivory-200 pb-4">
        <div>
          <h2 className="m-0 text-base font-medium text-navy-900">{title}</h2>
          <p className="mt-1 text-[9px] tracking-[0.03em] text-ink-500">{endpoint}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function AdminButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'muted'
}) {
  const palette =
    variant === 'primary'
      ? 'border-navy-900 bg-navy-900 text-white hover:bg-navy-700'
      : variant === 'outline'
        ? 'border-gold-300 bg-white text-navy-900 hover:bg-ivory-100'
        : 'border-ivory-200 bg-ivory-100 text-ink-500 hover:bg-ivory-200'

  return (
    <button
      className={`rounded-sm border px-4 py-2.5 text-[10px] font-medium tracking-[0.04em] transition disabled:cursor-not-allowed disabled:opacity-45 ${palette} ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

export function AdminField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block text-[10px] font-medium text-ink-700">
      {label} {required && <span className="text-gold-500">*</span>}
      {children}
    </label>
  )
}

export function AdminFeedback({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' }) {
  return (
    <p
      className={`rounded-sm border px-4 py-3 text-xs ${
        tone === 'success'
          ? 'border-[#cdd9c6] bg-[#f3f7f0] text-[#48613e]'
          : 'border-[#e5c7c0] bg-[#fbf3f1] text-error'
      }`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  )
}
