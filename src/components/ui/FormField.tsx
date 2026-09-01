import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type BaseFieldProps = { label: string; error?: string; hint?: string; children: ReactNode; className?: string }
export function FormField({ label, error, hint, children, className = '' }: BaseFieldProps) {
  return <label className={`grid gap-2 text-sm font-medium text-primary ${className}`}>{label}{children}{error ? <span className="text-xs font-normal tracking-normal text-error" role="alert">{error}</span> : hint ? <span className="text-xs font-normal tracking-normal text-muted">{hint}</span> : null}</label>
}
export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-14 min-w-0 rounded-md border border-border-subtle bg-white px-4 text-base text-navy-900 outline-none transition focus:border-gold-300 ${className}`} {...props} />
}
export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`h-14 min-w-0 rounded-md border border-border-subtle bg-white px-4 text-base text-navy-900 outline-none transition focus:border-gold-300 ${className}`} {...props}>{children}</select>
}
export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-[180px] min-w-0 rounded-md border border-border-subtle bg-white p-4 text-base leading-7 text-navy-900 outline-none transition focus:border-gold-300 ${className}`} {...props} />
}
