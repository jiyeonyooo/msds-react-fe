import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '../../components/motion'
import { quietnessApi } from './api'
import type { HourlyQuietness, SpaceQuietness } from './types'
import { quietnessLabel, toLocalDateTime } from './wellnessFormat'

/**
 * 시간대별 고요 지도.
 *
 * 이전 화면은 측정값이 없을 때 [29, 31, 34, …] 같은 고정 배열을 그리고 "22:00 — 07:00,
 * 평균 29–33 dB"라는 문구를 함께 보여 주어, 실제 측정과 무관한 숫자가 실측처럼 읽혔다.
 * 여기서는 hourly API 응답만으로 그리고, 값이 없는 시간대는 비어 있는 것으로 둔다.
 */
const hoursOfDay = Array.from({ length: 24 }, (_, hour) => hour)
const ringSize = 240
const ringRadius = 96
const center = ringSize / 2

const polar = (radius: number, degree: number) => {
  const radian = ((degree - 90) * Math.PI) / 180
  return [center + radius * Math.cos(radian), center + radius * Math.sin(radian)] as const
}

const arcPath = (radius: number, startDegree: number, endDegree: number) => {
  const [x1, y1] = polar(radius, startDegree)
  const [x2, y2] = polar(radius, endDegree)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

type Props = {
  spaces: SpaceQuietness[]
  loading?: boolean
  error?: string
}

export function QuietnessExplorer({ spaces, loading = false, error = '' }: Props) {
  const quietestSpace = useMemo(
    () => [...spaces].sort((a, b) => a.decibel - b.decibel)[0] ?? null,
    [spaces],
  )
  const [spaceId, setSpaceId] = useState<number | null>(null)
  // 응답이 도착했을 때만 갱신하고, 화면에 필요한 로딩 여부는 여기서 파생시킨다.
  const [loaded, setLoaded] = useState<{
    spaceId: number | null
    status: 'ready' | 'error'
    data: HourlyQuietness[]
  }>({ spaceId: null, status: 'ready', data: [] })
  const [selectedHour, setSelectedHour] = useState(() => new Date().getHours())

  const activeSpaceId = spaceId ?? quietestSpace?.spaceId ?? null
  const activeSpace = spaces.find((space) => space.spaceId === activeSpaceId) ?? null

  useEffect(() => {
    if (activeSpaceId === null) return
    let active = true
    const to = new Date()
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)
    quietnessApi
      .hourly(activeSpaceId, toLocalDateTime(from), toLocalDateTime(to))
      .then((data) => active && setLoaded({ spaceId: activeSpaceId, status: 'ready', data }))
      .catch(() => active && setLoaded({ spaceId: activeSpaceId, status: 'error', data: [] }))
    return () => {
      active = false
    }
  }, [activeSpaceId])

  const awaitingHourly = activeSpaceId !== null && loaded.spaceId !== activeSpaceId
  const hourlyStatus: 'loading' | 'ready' | 'error' = awaitingHourly ? 'loading' : loaded.status

  // 같은 시각이 여러 번 측정될 수 있어 마지막 값으로 덮는다.
  const byHour = useMemo(() => {
    const map = new Map<number, HourlyQuietness>()
    if (awaitingHourly) return map
    loaded.data.forEach((item) => map.set(new Date(item.hourStart).getHours(), item))
    return map
  }, [awaitingHourly, loaded])

  const measured = useMemo(() => [...byHour.values()], [byHour])
  const range = useMemo(() => {
    if (measured.length === 0) return null
    const values = measured.map((item) => item.averageDecibel)
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [measured])

  // 가장 조용한 3시간을 실제 측정값에서 찾는다. 자정을 넘겨 이어지는 구간도 본다.
  const quietestWindow = useMemo(() => {
    if (byHour.size < 3) return null
    let best: { start: number; end: number; average: number } | null = null
    hoursOfDay.forEach((start) => {
      const window = [0, 1, 2].map((offset) => byHour.get((start + offset) % 24))
      if (window.some((item) => !item)) return
      const average =
        window.reduce((sum, item) => sum + (item?.averageDecibel ?? 0), 0) / window.length
      if (!best || average < best.average) best = { start, end: (start + 3) % 24, average }
    })
    return best as { start: number; end: number; average: number } | null
  }, [byHour])

  const selected = byHour.get(selectedHour) ?? null
  const pad = (hour: number) => `${String(hour).padStart(2, '0')}:00`

  const toneFor = (item: HourlyQuietness | undefined) => {
    if (!item || !range) return { color: '#e7e0d5', opacity: 1 }
    // 조용할수록 옅게. 색이 아니라 농도로 표현해야 화면이 시끄러워지지 않는다.
    const span = range.max - range.min
    const ratio = span === 0 ? 0.5 : (item.averageDecibel - range.min) / span
    return { color: '#b79a67', opacity: 0.25 + ratio * 0.7 }
  }

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-dashed border-gold-300 bg-white p-12 text-center text-sm text-muted">
        {error}
      </div>
    )
  }

  if (spaces.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gold-300 bg-white p-12 text-center text-sm text-muted">
        아직 측정 중인 공간이 없습니다. 측정이 시작되면 시간대별 고요함이 이곳에 표시됩니다.
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
      <article className="rounded-lg bg-navy-900 p-8 text-white">
        <p className="text-[11px] font-medium tracking-[0.18em] text-gold-500">
          QUIETNESS BY HOUR · 시간대별 고요
        </p>
        <div className="relative mt-6 grid place-items-center">
          <svg
            aria-hidden="true"
            className="w-full max-w-[280px]"
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            {hoursOfDay.map((hour) => {
              const item = byHour.get(hour)
              const tone = toneFor(item)
              const isSelected = hour === selectedHour
              return (
                <path
                  d={arcPath(ringRadius, hour * 15 + 1.6, (hour + 1) * 15 - 1.6)}
                  fill="none"
                  key={hour}
                  stroke={isSelected ? '#fff' : tone.color}
                  strokeDasharray={item ? undefined : '2 4'}
                  strokeLinecap="round"
                  strokeOpacity={isSelected ? 1 : tone.opacity}
                  strokeWidth={isSelected ? 16 : 12}
                />
              )
            })}
            {[0, 6, 12, 18].map((hour) => {
              const [x, y] = polar(ringRadius - 26, hour * 15 + 7.5)
              return (
                <text
                  className="fill-white/40 font-sans text-[9px]"
                  key={hour}
                  textAnchor="middle"
                  x={x}
                  y={y + 3}
                >
                  {pad(hour)}
                </text>
              )
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <span className="animate-breathe absolute inset-[62px] rounded-full border border-gold-300/20" />
            <span className="relative text-[10px] tracking-[0.16em] text-white/50">
              {pad(selectedHour)}
            </span>
            <strong className="relative mt-1 font-display text-4xl font-normal">
              {selected ? selected.averageDecibel.toFixed(1) : '—'}
              <small className="ml-1 font-sans text-xs text-white/50">dB</small>
            </strong>
            <span className="relative mt-1 text-xs text-gold-300">
              {selected ? quietnessLabel[selected.level] : '측정값 없음'}
            </span>
          </div>
        </div>
        <label className="mt-7 block text-[10px] tracking-[0.14em] text-white/50">
          시간대 선택
          <input
            className="mt-3 h-1 w-full appearance-none rounded-full bg-white/15 accent-gold-500"
            max={23}
            min={0}
            onChange={(event) => setSelectedHour(Number(event.target.value))}
            step={1}
            type="range"
            value={selectedHour}
          />
        </label>
        {selected && (
          <p className="mt-4 text-xs leading-6 text-white/60">
            {pad(selectedHour)} 기준 최저 {selected.minimumDecibel.toFixed(1)} · 최고{' '}
            {selected.maximumDecibel.toFixed(1)} dB · 측정 {selected.sampleCount}회
          </p>
        )}
      </article>

      <article className="rounded-lg border border-border-subtle bg-white p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-medium">공간을 고르면 하루의 흐름이 보여요</h3>
          {activeSpace && (
            <Link
              className="text-xs text-gold-500 underline underline-offset-4 hover:text-navy-900"
              to={`/wellness/quietness/${activeSpace.spaceId}`}
            >
              24시간 기록 보기 →
            </Link>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {spaces.map((space) => {
            const active = space.spaceId === activeSpaceId
            return (
              <button
                className={`rounded-full border px-4 py-2 text-xs transition ${
                  active
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : 'border-border-subtle text-ink-700 hover:border-gold-300'
                }`}
                key={space.spaceId}
                onClick={() => setSpaceId(space.spaceId)}
                type="button"
              >
                {space.spaceName}
                <span className={`ml-2 ${active ? 'text-gold-300' : 'text-muted'}`}>
                  {space.decibel.toFixed(1)} dB
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-7 space-y-6">
          {quietestSpace && (
            <p className="rounded-md bg-subtle px-5 py-4 text-sm leading-6 text-ink-700">
              지금 가장 조용한 공간은 <b className="text-navy-900">{quietestSpace.spaceName}</b>
              입니다 · {quietestSpace.decibel.toFixed(1)} dB · {quietnessLabel[quietestSpace.level]}
            </p>
          )}

          {hourlyStatus === 'loading' && <Skeleton className="h-24 rounded-md" />}
          {hourlyStatus === 'error' && (
            <p className="text-sm text-muted">이 공간의 시간대별 기록을 지금 불러올 수 없습니다.</p>
          )}
          {hourlyStatus === 'ready' && quietestWindow && (
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] text-gold-500">
                QUIETEST HOURS · 최근 24시간 기준
              </p>
              <p className="mt-3 font-display text-2xl">
                {pad(quietestWindow.start)} — {pad(quietestWindow.end)}
              </p>
              <p className="mt-3 text-xs leading-6 text-muted">
                평균 {quietestWindow.average.toFixed(1)} dB로 가장 고요했어요.
                {range &&
                  ` 같은 기간 측정 범위는 ${range.min.toFixed(1)}–${range.max.toFixed(1)} dB입니다.`}
              </p>
            </div>
          )}
          {hourlyStatus === 'ready' && !quietestWindow && (
            <p className="text-sm leading-6 text-muted">
              측정된 시간대가 아직 적어 가장 조용한 구간을 계산하지 못했습니다.
              {byHour.size > 0 && ` 현재 ${byHour.size}개 시간대의 기록이 있습니다.`}
            </p>
          )}
        </div>
      </article>
    </div>
  )
}
