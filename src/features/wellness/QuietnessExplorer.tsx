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
const ringCircumference = 2 * Math.PI * ringRadius
const gaugeMaxDecibel = 80
const dialCenter = ringSize / 2
const dialTickOuterRadius = 82

function pointOnDial(hour: number, radius: number) {
  const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2
  return {
    x: dialCenter + Math.cos(angle) * radius,
    y: dialCenter + Math.sin(angle) * radius,
  }
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
  const latestSpace = useMemo(
    () =>
      [...spaces].sort(
        (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
      )[0] ?? null,
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

  // 처음 열 때는 가장 낮은 과거값이 아니라 가장 최근에 측정된 공간을 보여 준다.
  // 관리자가 방금 값을 등록한 뒤에도 빈 시간대가 기본 선택되는 혼란을 막는다.
  const activeSpaceId = spaceId ?? latestSpace?.spaceId ?? null
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
  const quietestMeasuredHour = useMemo(() => {
    if (measured.length === 0) return null
    const quietest = measured.reduce((best, item) =>
      item.averageDecibel < best.averageDecibel ? item : best,
    )
    return new Date(quietest.hourStart).getHours()
  }, [measured])
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
  const gaugeProgress = selected
    ? Math.min(1, Math.max(0, selected.averageDecibel / gaugeMaxDecibel))
    : 0

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
          HOURLY AVERAGE · 시간대별 평균 소음
        </p>
        <p className="mt-3 text-xs leading-6 text-white/55">
          바늘은 선택한 시간을, 금색 원호는 해당 시간의 평균 소음을 나타냅니다.
        </p>
        <div className="relative mt-6 grid place-items-center">
          <svg
            aria-hidden="true"
            className="w-full max-w-[280px]"
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              fill="none"
              r={ringRadius}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="12"
            />
            <circle
              className="transition-[stroke-dashoffset] duration-700 ease-calm"
              cx={ringSize / 2}
              cy={ringSize / 2}
              fill="none"
              r={ringRadius}
              stroke={selected ? '#c6a86b' : 'rgba(255,255,255,0.18)'}
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference * (1 - gaugeProgress)}
              strokeLinecap="round"
              strokeWidth="14"
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
            {hoursOfDay.map((hour) => {
              const majorTick = hour % 6 === 0
              const inner = pointOnDial(hour, majorTick ? 72 : 76)
              const outer = pointOnDial(hour, dialTickOuterRadius)
              const isQuietest = hour === quietestMeasuredHour

              return (
                <g key={hour}>
                  <line
                    stroke={isQuietest ? '#c6a86b' : 'rgba(255,255,255,0.34)'}
                    strokeLinecap="round"
                    strokeWidth={majorTick || isQuietest ? 1.8 : 1}
                    x1={inner.x}
                    x2={outer.x}
                    y1={inner.y}
                    y2={outer.y}
                  />
                  {isQuietest && <circle cx={outer.x} cy={outer.y} fill="#c6a86b" r="3.2" />}
                </g>
              )
            })}
            <g
              className="transition-transform duration-500 ease-calm motion-reduce:transition-none"
              style={{
                transform: `rotate(${selectedHour * 15}deg)`,
                transformOrigin: `${dialCenter}px ${dialCenter}px`,
              }}
            >
              <line
                stroke="rgba(255,255,255,0.82)"
                strokeLinecap="round"
                strokeWidth="2"
                x1={dialCenter}
                x2={dialCenter}
                y1={dialCenter + 7}
                y2={dialCenter - 61}
              />
              <circle cx={dialCenter} cy={dialCenter - 61} fill="#f4ead6" r="2.8" />
            </g>
            <circle cx={dialCenter} cy={dialCenter} fill="#c6a86b" r="4.5" />
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <span className="relative justify-self-center bg-navy-900/90 px-2 text-[10px] tracking-[0.16em] text-white/50">
              {pad(selectedHour)} 평균
            </span>
            <strong className="relative mt-1 bg-navy-900/90 px-2 font-display text-4xl font-normal">
              {selected ? selected.averageDecibel.toFixed(1) : '—'}
              <small className="ml-1 font-sans text-xs text-white/50">dB</small>
            </strong>
            <span className="relative mt-1 justify-self-center bg-navy-900/90 px-2 text-xs text-gold-300">
              {selected ? quietnessLabel[selected.level] : '측정값 없음'}
            </span>
          </div>
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-white/40">
          <span>0 dB · 거의 무음</span>
          <span>80+ dB · 매우 시끄러움</span>
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
            등록된 {selected.sampleCount}개 값 · 최저 {selected.minimumDecibel.toFixed(1)} · 최고{' '}
            {selected.maximumDecibel.toFixed(1)} dB
          </p>
        )}
        {!selected && (
          <p className="mt-4 text-xs leading-6 text-white/60">
            이 시간에는 등록된 측정값이 없습니다. 관리자 화면에서 값을 등록하면 표시됩니다.
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
              각 공간의 최신 측정값 중 <b className="text-navy-900">{quietestSpace.spaceName}</b>이
              가장 낮습니다 · {quietestSpace.decibel.toFixed(1)} dB ·{' '}
              {quietnessLabel[quietestSpace.level]}
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
