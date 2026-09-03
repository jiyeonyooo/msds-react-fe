import { useEffect, useMemo, useRef, useState } from 'react'

type DatePickerProps = {
  'aria-invalid'?: boolean
  label: string
  min?: string
  onChange: (value: string) => void
  value: string
}

const weekdayLabels = ['월', '화', '수', '목', '금', '토', '일']

const fromIso = (value: string) => new Date(`${value}T00:00:00Z`)
const toIso = (date: Date) => date.toISOString().slice(0, 10)
const monthStart = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
const addMonths = (date: Date, amount: number) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1))

export function DatePicker({ label, min, onChange, value, ...props }: DatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(value ? fromIso(value) : new Date()))
  const selectedDate = value ? fromIso(value) : null
  const minimumDate = min ? fromIso(min) : null

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const days = useMemo(() => {
    const firstDay = (visibleMonth.getUTCDay() + 6) % 7
    const daysInMonth = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth() + 1, 0)).getUTCDate()
    return Array.from({ length: firstDay + daysInMonth }, (_, index) => {
      if (index < firstDay) return null
      return new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth(), index - firstDay + 1))
    })
  }, [visibleMonth])
  const monthLabel = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(visibleMonth)
  const valueLabel = selectedDate
    ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short', timeZone: 'UTC' }).format(selectedDate)
    : '날짜를 선택해 주세요'

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-invalid={props['aria-invalid']}
        className="flex h-8 w-full items-center justify-between gap-2 text-left text-sm text-navy-900 outline-none"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{valueLabel}</span>
        <CalendarIcon />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+14px)] left-0 z-30 w-[296px] border border-gold-300 bg-white p-4 shadow-floating" role="dialog" aria-label={`${label} 날짜 선택`}>
          <div className="mb-4 flex items-center justify-between">
            <button aria-label="이전 달" className="grid size-7 place-items-center text-navy-900 hover:bg-ivory-100 focus-visible:outline-2 focus-visible:outline-gold-500" onClick={() => setVisibleMonth((current) => addMonths(current, -1))} type="button"><Chevron direction="left" /></button>
            <strong className="font-display text-xl font-medium text-navy-900">{monthLabel}</strong>
            <button aria-label="다음 달" className="grid size-7 place-items-center text-navy-900 hover:bg-ivory-100 focus-visible:outline-2 focus-visible:outline-gold-500" onClick={() => setVisibleMonth((current) => addMonths(current, 1))} type="button"><Chevron direction="right" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-muted">
            {weekdayLabels.map((weekday) => <span className="py-1" key={weekday}>{weekday}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day, index) => {
              if (!day) return <span key={`blank-${index}`} />
              const iso = toIso(day)
              const isSelected = iso === value
              const isDisabled = minimumDate !== null && day < minimumDate
              return <button aria-label={iso} className={`mx-auto grid size-8 place-items-center rounded-full text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${isSelected ? 'bg-navy-900 text-white' : isDisabled ? 'cursor-not-allowed text-ink-500/35' : 'text-navy-900 hover:bg-ivory-100 hover:text-gold-500'}`} disabled={isDisabled} key={iso} onClick={() => { onChange(iso); setIsOpen(false) }} type="button">{day.getUTCDate()}</button>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarIcon() {
  return <svg aria-hidden="true" className="size-[18px] shrink-0 text-gold-500" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.25" viewBox="0 0 18 18"><rect height="12.5" rx="1.25" width="13.5" x="2.25" y="3.25" /><path d="M5.5 1.75v3m7-3v3M2.25 7h13.5" /></svg>
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return <svg aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" viewBox="0 0 10 10"><path d={direction === 'left' ? 'm6 1-4 4 4 4' : 'm4 1 4 4-4 4'} /></svg>
}
