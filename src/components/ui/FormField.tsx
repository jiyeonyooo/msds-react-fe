import { Children, isValidElement, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, useEffect, useId, useRef, useState } from 'react'

type BaseFieldProps = { label: string; error?: string; hint?: string; children: ReactNode; className?: string }
type SelectProps = {
  'aria-invalid'?: boolean
  children: ReactNode
  className?: string
  defaultValue?: string | number
  disabled?: boolean
  id?: string
  name?: string
  onValueChange?: (value: string) => void
  value?: string | number
}

export function FormField({ label, error, hint, children, className = '' }: BaseFieldProps) {
  return <label className={`grid gap-2 text-sm font-medium text-primary ${className}`}>{label}{children}{error ? <span className="text-xs font-normal tracking-normal text-error" role="alert">{error}</span> : hint ? <span className="text-xs font-normal tracking-normal text-muted">{hint}</span> : null}</label>
}
export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-14 min-w-0 rounded-md border border-border-subtle bg-white px-4 text-base text-navy-900 outline-none transition focus:border-gold-300 ${className}`} {...props} />
}
export function Select({ className = '', children, defaultValue, disabled, id, name, onValueChange, value, ...props }: SelectProps) {
  const options = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)) return []
    return [{ value: String(child.props.value ?? ''), label: child.props.children, disabled: child.props.disabled ?? false }]
  })
  const initialValue = String(value ?? defaultValue ?? options[0]?.value ?? '')
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const selectedValue = value === undefined ? uncontrolledValue : String(value)
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0]

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => { if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false) }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsOpen(false) }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('mousedown', closeOnOutsideClick); document.removeEventListener('keydown', closeOnEscape) }
  }, [])

  const selectOption = (nextValue: string) => {
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      {name && <input name={name} type="hidden" value={selectedValue} />}
      <button aria-controls={listboxId} aria-expanded={isOpen} aria-haspopup="listbox" className={`msds-select flex items-center justify-between gap-3 text-left ${className}`} disabled={disabled} id={id} onClick={() => setIsOpen((current) => !current)} type="button" {...props}>
        <span className="truncate">{selectedOption?.label}</span><Chevron />
      </button>
      {isOpen && (
        <div aria-labelledby={id} className="absolute top-[calc(100%+8px)] left-0 z-30 min-w-full overflow-hidden border border-gold-300 bg-white py-1 shadow-floating" id={listboxId} role="listbox">
          {options.map((option) => <button aria-selected={option.value === selectedValue} className={`flex w-full items-center px-4 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-gold-500 ${option.value === selectedValue ? 'bg-ivory-100 text-navy-900' : 'text-ink-700 hover:bg-gold-300/25 hover:text-navy-900'} disabled:cursor-not-allowed disabled:text-ink-500/45`} disabled={option.disabled} key={option.value} onClick={() => selectOption(option.value)} role="option" type="button">{option.label}</button>)}
        </div>
      )}
    </div>
  )
}
export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-[180px] min-w-0 rounded-md border border-border-subtle bg-white p-4 text-base leading-7 text-navy-900 outline-none transition focus:border-gold-300 ${className}`} {...props} />
}

function Chevron() {
  return <svg aria-hidden="true" className="h-1.5 w-2.5 shrink-0 text-gold-500" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" viewBox="0 0 10 6"><path d="m1 1 4 4 4-4" /></svg>
}
