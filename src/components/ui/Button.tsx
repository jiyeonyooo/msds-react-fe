import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger'
type ButtonSize = 'sm' | 'md'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-navy-900 text-white hover:bg-navy-700 disabled:bg-[#bdbbb6] disabled:text-white',
  secondary: 'border border-navy-900 bg-transparent text-navy-900 hover:bg-ivory-100',
  text: 'bg-transparent px-0 text-gold-500 hover:text-navy-900',
  danger: 'border border-error-border bg-transparent text-error hover:bg-[#f8eeeb]',
}
const sizes: Record<ButtonSize, string> = { sm: 'px-[18px] py-3 text-[11px]', md: 'px-6 py-[13px] text-xs' }

export function Button({ className = '', children, size = 'md', type = 'button', variant = 'primary', ...props }: ButtonProps) {
  return <button className={`inline-flex min-h-[44px] items-center justify-center rounded-sm font-medium tracking-[0.4px] whitespace-nowrap transition disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`} type={type} {...props}>{children}</button>
}
