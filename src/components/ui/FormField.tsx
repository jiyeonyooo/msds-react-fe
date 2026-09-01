import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

type BaseFieldProps = { label: string; error?: string; children: ReactNode; className?: string }
export function FormField({ label, error, children, className = '' }: BaseFieldProps) {
  return <label className={`grid gap-2 text-sm font-medium text-primary ${className}`}>{label}{children}{error && <span className="text-xs font-normal tracking-normal text-error">{error}</span>}</label>
}
export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-14 min-w-0 rounded-md border border-border-subtle bg-white px-4 text-base text-navy-900 outline-none transition focus:border-gold-300 ${className}`} {...props} />
}
export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`h-14 min-w-0 rounded-md border border-border-subtle bg-white px-4 text-base text-navy-900 outline-none transition focus:border-gold-300 ${className}`} {...props}>{children}</select>
}
