import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { quietnessApi } from './api'
import { quietnessLabel, toLocalDateTime } from './wellnessFormat'
import type { HourlyQuietness, QuietnessHistoryPoint, SpaceQuietness } from './types'

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function hourLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', hour12: false }).format(
    new Date(value),
  )
}

export function QuietnessSpaceDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const selectedId = Number(params.spaceId)
  const [spaces, setSpaces] = useState<SpaceQuietness[]>([])
  const [current, setCurrent] = useState<SpaceQuietness | null>(null)
  const [history, setHistory] = useState<QuietnessHistoryPoint[]>([])
  const [hourly, setHourly] = useState<HourlyQuietness[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const to = new Date()
    const historyFrom = new Date(to.getTime() - 24 * 60 * 60 * 1000)
    const hourlyFrom = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
    Promise.all([
      quietnessApi.spaces(),
      quietnessApi.current(selectedId),
      quietnessApi.history(selectedId, toLocalDateTime(historyFrom), toLocalDateTime(to)),
      quietnessApi.hourly(selectedId, toLocalDateTime(hourlyFrom), toLocalDateTime(to)),
    ])
      .then(([spaceData, currentData, historyData, hourlyData]) => {
        if (!active) return
        setSpaces(spaceData)
        setCurrent(currentData)
        setHistory(historyData)
        setHourly(hourlyData)
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error ? reason.message : '조용함 데이터를 불러오지 못했습니다.',
          )
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [selectedId])

  const historyValues = history.map((item) => item.decibel)
  const historyAverage = average(historyValues)
  const historyMinimum = historyValues.length ? Math.min(...historyValues) : 0
  const historyMaximum = historyValues.length ? Math.max(...historyValues) : 0
  const latestHour = hourly.at(-1)
  const quietestHour = useMemo(
    () => [...hourly].sort((a, b) => a.averageDecibel - b.averageDecibel)[0],
    [hourly],
  )

  if (!Number.isInteger(selectedId) || selectedId < 1) {
    return (
      <main className="mx-auto max-w-[1240px] px-6 py-24 text-center">
        올바르지 않은 공간입니다.
      </main>
    )
  }

  return (
    <main className="bg-canvas">
      <section className="mx-auto max-w-[1240px] px-6 py-16 md:px-12">
        <p className="text-[11px] font-medium tracking-[1.8px] text-gold-500">
          WELLNESS&nbsp; / &nbsp;QUIETNESS&nbsp; / &nbsp;SPACE
        </p>
        <h1 className="mt-4 font-display text-[48px] font-medium leading-none md:text-[58px]">
          Listen to the shape of silence
        </h1>
        <h2 className="mt-5 text-[21px] font-medium">공간의 고요를 시간으로 읽다</h2>
        <p className="mt-3 text-[13px] text-ink-700">
          명상실의 현재 소음과 시간대별 변화를 확인해 가장 깊은 휴식의 순간을 선택하세요.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <select
            aria-label="측정 공간"
            className="h-[52px] min-w-[250px] border border-ivory-200 bg-white px-[18px] text-[11px] font-medium outline-none"
            onChange={(event) => navigate(`/wellness/quietness/${event.target.value}`)}
            value={selectedId}
          >
            {spaces.map((space) => (
              <option key={space.spaceId} value={space.spaceId}>
                {space.spaceName} · {space.spaceType}
              </option>
            ))}
          </select>
          <Link
            className="inline-flex min-h-11 items-center border border-gold-300 bg-white px-6 text-[13px] font-medium"
            to="/wellness"
          >
            공간 목록으로
          </Link>
        </div>
      </section>

      {error ? (
        <section className="bg-subtle px-6 py-24 text-center text-sm text-error" role="alert">
          {error}
        </section>
      ) : (
        <>
          <section className="bg-subtle py-12">
            <div className="mx-auto max-w-[1240px] px-6 md:px-12">
              <SectionHeading
                eyebrow="CURRENT QUIETNESS · 지금의 고요"
                title={`${current?.spaceName ?? '공간'}의 현재 상태`}
              />
              <div className="mt-[18px] grid gap-5 lg:grid-cols-[390px_410px_400px]">
                <article className="h-[252px] rounded-sm bg-navy-900 p-8 text-white">
                  <p className="text-[10px] font-medium tracking-[1.5px] text-gold-300">
                    {current?.spaceType ?? 'MEASURING'} · 현재
                  </p>
                  <strong className="mt-2 block font-display text-[66px] font-medium leading-[78px]">
                    {loading ? '…' : (current?.decibel.toFixed(1) ?? '—')}{' '}
                    <small className="font-sans text-xs font-normal text-white/70">dB</small>
                  </strong>
                  <QuietnessBadge level={current?.level} />
                  <p className="mt-3 text-[10px] text-white/65">
                    몸을 긴장시키지 않는 편안한 소리 환경입니다.
                  </p>
                </article>
                <article className="h-[252px] border border-ivory-200 bg-white p-7">
                  <h3 className="text-lg font-medium">측정 요약</h3>
                  <Metric
                    label="최근 1시간 평균"
                    value={latestHour ? `${latestHour.averageDecibel.toFixed(1)} dB` : '—'}
                  />
                  <Metric
                    label="최저 측정값"
                    value={latestHour ? `${latestHour.minimumDecibel.toFixed(1)} dB` : '—'}
                  />
                  <Metric
                    label="표본 수"
                    value={latestHour ? `${latestHour.sampleCount} samples` : '—'}
                  />
                </article>
                <article className="h-[252px] border border-ivory-200 bg-white p-7">
                  <h3 className="text-lg font-medium">측정 정보</h3>
                  <p className="mt-5 text-[9px] font-medium tracking-[1.2px] text-gold-500">
                    LATEST MEASURED
                  </p>
                  <p className="mt-3 text-lg font-medium">
                    {current ? timeLabel(current.measuredAt) : '—'}
                  </p>
                  <p className="mt-5 text-[11px] leading-5 text-ink-700">
                    실시간 측정값은 공간과 기기 상태에 따라 갱신됩니다. 조용한 활동을 위한 참고
                    정보로 확인하세요.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="py-11">
            <div className="mx-auto max-w-[1240px] px-6 md:px-12">
              <SectionHeading eyebrow="HISTORY · 시간의 흐름" title="기간별 조용함 변화" />
              <div className="mt-4 grid gap-5 lg:grid-cols-[820px_400px]">
                <article className="h-[348px] border border-ivory-200 bg-white px-7 py-6">
                  <h3 className="text-lg font-medium">최근 24시간 데시벨 추이</h3>
                  <HistoryChart points={history} />
                </article>
                <article className="h-[348px] border border-ivory-200 bg-white px-7 py-6">
                  <h3 className="text-lg font-medium">24시간 요약</h3>
                  <Metric
                    label="평균"
                    value={history.length ? `${historyAverage.toFixed(1)} dB` : '—'}
                  />
                  <Metric
                    label="최저"
                    value={history.length ? `${historyMinimum.toFixed(1)} dB` : '—'}
                  />
                  <Metric
                    label="최고"
                    value={history.length ? `${historyMaximum.toFixed(1)} dB` : '—'}
                  />
                  <Metric
                    label="측정 수"
                    value={new Intl.NumberFormat('ko-KR').format(history.length)}
                  />
                  <QuietnessBadge level={latestHour?.level} light />
                </article>
              </div>
            </div>
          </section>

          <section className="bg-canvas py-10">
            <div className="mx-auto max-w-[1240px] px-6 md:px-12">
              <SectionHeading eyebrow="HOURLY · 시간대별 통계" title="고요가 깊어지는 시간" />
              <div className="mt-5 grid gap-5 lg:grid-cols-[820px_400px]">
                <article className="h-[310px] border border-ivory-200 bg-white px-7 py-6">
                  <h3 className="text-lg font-medium">시간대별 평균 데시벨</h3>
                  <div className="mt-5 flex h-[200px] items-end justify-around gap-3 overflow-hidden px-2 pb-6">
                    {hourly.slice(-8).map((item) => (
                      <div
                        className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                        key={item.hourStart}
                      >
                        <span
                          className={
                            item === quietestHour ? 'w-12 bg-navy-900' : 'w-12 bg-gold-300'
                          }
                          style={{ height: `${Math.max(16, 190 - item.averageDecibel * 3)}px` }}
                          title={`${item.averageDecibel.toFixed(1)} dB`}
                        />
                        <span className="text-[9px] text-ink-700">{hourLabel(item.hourStart)}</span>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="h-[310px] border border-ivory-200 bg-white px-7 py-6">
                  <p className="text-[9px] font-medium tracking-[1.3px] text-gold-500">
                    QUIETEST WINDOW
                  </p>
                  <p className="mt-3 font-display text-[31px] font-medium">
                    {quietestHour ? `${hourLabel(quietestHour.hourStart)}:00` : '—'}
                  </p>
                  <p className="mt-4 text-xs leading-5 text-ink-700">
                    {quietestHour
                      ? `평균 ${quietestHour.averageDecibel.toFixed(1)} dB로 조회 기간 중 가장 고요합니다. 호흡 명상이나 독서에 권합니다.`
                      : '시간대별 측정값을 기다리고 있습니다.'}
                  </p>
                  <div className="mt-4">
                    <QuietnessBadge level={quietestHour?.level} />
                  </div>
                  <p className="mt-4 text-[10px] text-ink-700">
                    표본 {quietestHour?.sampleCount ?? 0}개 · 최근 7일 집계
                  </p>
                </article>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-[1.5px] text-gold-500">{eyebrow}</p>
      <h2 className="mt-2 font-display text-[29px] font-medium leading-9">{title}</h2>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 flex h-11 items-center justify-between border-b border-ivory-200 text-[11px]">
      <span className="text-ink-700">{label}</span>
      <strong className="text-sm font-medium">{value}</strong>
    </div>
  )
}

function QuietnessBadge({
  level,
  light = false,
}: {
  level?: SpaceQuietness['level']
  light?: boolean
}) {
  return (
    <span
      className={`inline-flex h-[30px] min-w-[118px] items-center justify-center rounded-full border border-gold-300 px-4 text-[10px] font-medium ${light ? 'bg-subtle text-gold-500' : 'bg-gold-500 text-white'}`}
    >
      {level ? quietnessLabel[level] : '측정 중'}
    </span>
  )
}

function HistoryChart({ points }: { points: QuietnessHistoryPoint[] }) {
  if (!points.length) {
    return (
      <div className="grid h-[244px] place-items-center text-xs text-ink-700">
        측정 이력이 없습니다.
      </div>
    )
  }
  const width = 710
  const height = 180
  const values = points.map((point) => point.decibel)
  const minimum = Math.min(...values) - 2
  const maximum = Math.max(...values) + 2
  const range = Math.max(1, maximum - minimum)
  const coordinates = points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width
      const y = height - ((point.decibel - minimum) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="mt-4 h-[244px] overflow-hidden">
      <svg
        aria-label="최근 24시간 데시벨 추이"
        className="h-[200px] w-full"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            stroke="#e7e0d5"
            strokeWidth="1"
            x1="0"
            x2={width}
            y1={(line * height) / 3}
            y2={(line * height) / 3}
          />
        ))}
        <polyline
          fill="none"
          points={coordinates}
          stroke="#b79a67"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      <div className="flex justify-between text-[9px] text-ink-700">
        {points
          .filter((_, index) => index % Math.max(1, Math.floor(points.length / 6)) === 0)
          .slice(0, 7)
          .map((point) => (
            <span key={point.measuredAt}>{hourLabel(point.measuredAt)}</span>
          ))}
      </div>
    </div>
  )
}
