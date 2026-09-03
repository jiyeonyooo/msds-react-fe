import type { ReactNode } from 'react'

type BookingFieldProps = { label: string; children: ReactNode; className?: string; as?: 'div' | 'label' }
export function BookingField({ label, children, className = '', as: Tag = 'label' }: BookingFieldProps) {
  return <Tag className={`grid min-h-[88px] gap-[6px] border border-border-subtle bg-white p-4 text-[10px] font-medium tracking-[1.2px] text-muted transition-colors focus-within:border-gold-500 focus-within:bg-ivory-50 ${className}`}><span>{label}</span>{children}</Tag>
}
