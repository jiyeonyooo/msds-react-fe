import { CountUp } from '../../components/motion'

/**
 * 남은 자리를 게이지로 보여 준다.
 *
 * 숫자만 적혀 있을 때는 "5석"이 많은 건지 적은 건지 읽히지 않았다. 정원 대비 비율을 함께
 * 그리되, 재촉하는 붉은 경고 대신 브랜드 톤 안에서 농도만 달리한다.
 */
export function SeatGauge({
  remain,
  capacity,
  tone = 'light',
}: {
  remain: number
  capacity: number
  tone?: 'light' | 'dark'
}) {
  const safeCapacity = Math.max(capacity, 1)
  const filled = Math.min(100, Math.max(0, (remain / safeCapacity) * 100))
  const almostFull = remain > 0 && remain <= Math.max(1, Math.round(safeCapacity * 0.2))
  const dark = tone === 'dark'

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`text-xs font-medium ${dark ? 'text-white/70' : 'text-ink-500'}`}>
          잔여{' '}
          <b
            className={`font-display text-lg ${remain === 0 ? (dark ? 'text-white/50' : 'text-ink-500') : 'text-gold-500'}`}
          >
            <CountUp value={remain} />
          </b>{' '}
          / 정원 {capacity}
        </p>
        {remain === 0 ? (
          <span
            className={`text-[10px] tracking-[0.12em] ${dark ? 'text-white/50' : 'text-muted'}`}
          >
            자리 마감
          </span>
        ) : almostFull ? (
          <span className="text-[10px] tracking-[0.12em] text-gold-500">마감 임박</span>
        ) : null}
      </div>
      <div
        aria-hidden="true"
        className={`mt-2 h-1 rounded-full ${dark ? 'bg-white/15' : 'bg-ivory-200'}`}
      >
        <i
          className="block h-full rounded-full bg-gold-500 transition-[width] duration-[760ms] ease-calm"
          style={{ width: `${filled}%` }}
        />
      </div>
    </div>
  )
}
