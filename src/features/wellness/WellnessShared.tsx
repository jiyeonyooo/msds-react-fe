import type { ReactNode } from 'react'
import { CountUp } from '../../components/motion'
import type { WellnessTrendPoint } from './types'
import { formatDate } from './wellnessFormat'

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium tracking-[0.18em] text-gold-500">{children}</p>
}

export function ScoreDisc({
  score,
  label,
  eyebrow = "TODAY'S RESULT",
  note,
}: {
  score: number | null
  label: string
  eyebrow?: string
  note?: string
}) {
  return (
    <div className="relative flex size-[300px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-full bg-navy-900 px-8 py-9 text-center text-white sm:size-[340px] md:size-[360px]">
      {/* 결과 원 뒤에서 9초 주기로 아주 느리게 커졌다 작아지는 고리.
          들숨·날숨 리듬에 맞춘 속도라 화면을 재촉하지 않고 호흡을 늦추는 쪽으로 작동한다. */}
      <span
        aria-hidden="true"
        className="absolute inset-6 animate-breathe rounded-full border border-gold-300/25"
      />
      <span
        aria-hidden="true"
        className="absolute inset-12 animate-breathe rounded-full border border-gold-300/15 [animation-delay:1.2s]"
      />
      <SectionLabel>{eyebrow}</SectionLabel>
      <strong className="relative mt-4 font-display text-[68px] font-normal leading-[0.9] sm:text-[76px]">
        {score === null ? '—' : <CountUp duration={1400} value={score} />}
      </strong>
      <span className="relative mt-2 text-[13px] text-white/60">마음 부담도 / 100</span>
      <b className="relative mt-3 text-xl sm:text-2xl">{label}</b>
      {note && <span className="relative mt-3 max-w-[230px] text-[11px] leading-4 text-gold-300">{note}</span>}
    </div>
  )
}

export function TrendChart({ points }: { points: WellnessTrendPoint[] }) {
  const normalized = points.slice(-6)
  const chartPoints = normalized.length
    ? normalized.map((point, index) => ({
        ...point,
        x: normalized.length === 1 ? 50 : 8 + (index * 84) / (normalized.length - 1),
        y: 12 + point.totalScore * 0.7,
      }))
    : []
  const polyline = chartPoints.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <div>
      <svg
        className="h-[220px] w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="마음 부담도 변화 그래프"
      >
        {[15, 45, 75].map((y) => (
          <line key={y} x1="4" x2="96" y1={y} y2={y} stroke="#e7e0d5" strokeWidth="0.5" />
        ))}
        {chartPoints.length > 1 && (
          <polyline
            fill="none"
            points={polyline}
            stroke="#b79a67"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {chartPoints.map((point, index) => (
          <circle
            key={point.checkId}
            cx={point.x}
            cy={point.y}
            fill={index === chartPoints.length - 1 ? '#b79a67' : '#0e2239'}
            r="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {normalized.length > 0 && (
        <div
          className="mt-5 grid gap-5"
          style={{
            gridTemplateColumns: `repeat(${Math.min(normalized.length, 3)}, minmax(0, 1fr))`,
          }}
        >
          {normalized.slice(-3).map((point) => (
            <div key={point.checkId}>
              <strong className="font-display text-xl font-normal">{point.totalScore}</strong>
              <p className="mt-1 text-[11px] text-muted">{formatDate(point.checkedAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
