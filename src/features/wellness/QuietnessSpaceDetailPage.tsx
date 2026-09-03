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

function hourOfDayLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}시`
}

const spaceTypeLabels: Record<SpaceQuietness['spaceType'], string> = {
  ROOM: '객실',
  LOUNGE: '라운지',
  MEDITATION_ROOM: '명상실',
  COMMON_AREA: '공용 공간',
  FACILITY: '부대시설',
  OTHER: '기타 공간',
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
  const hourlyByTimeOfDay = useMemo(() => {
    const buckets = new Map<number, { weightedTotal: number; sampleCount: number }>()

    hourly.forEach((item) => {
      const hour = new Date(item.hourStart).getHours()
      const currentBucket = buckets.get(hour) ?? { weightedTotal: 0, sampleCount: 0 }
      currentBucket.weightedTotal += item.averageDecibel * item.sampleCount
      currentBucket.sampleCount += item.sampleCount
      buckets.set(hour, currentBucket)
    })

    return [...buckets.entries()]
      .sort(([firstHour], [secondHour]) => firstHour - secondHour)
      .map(([hour, bucket]) => ({
        hour,
        averageDecibel: bucket.weightedTotal / bucket.sampleCount,
        sampleCount: bucket.sampleCount,
      }))
  }, [hourly])
  const quietestTimeOfDay = useMemo(
    () => [...hourlyByTimeOfDay].sort((a, b) => a.averageDecibel - b.averageDecibel)[0],
    [hourlyByTimeOfDay],
  )
  const totalHourlySamples = hourlyByTimeOfDay.reduce((total, item) => total + item.sampleCount, 0)
  const hourlyValues = hourlyByTimeOfDay.map((item) => item.averageDecibel)
  const hourlyMinimum = hourlyValues.length ? Math.min(...hourlyValues) : 0
  const hourlyMaximum = hourlyValues.length ? Math.max(...hourlyValues) : 0
  const hourlyRange = Math.max(1, hourlyMaximum - hourlyMinimum)

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
          웰니스&nbsp; / &nbsp;공간별 조용함
        </p>
        <h1 className="mt-4 text-[42px] font-medium leading-tight md:text-[52px]">
          이 공간은 지금 얼마나 조용할까요?
        </h1>
        <h2 className="mt-5 text-[21px] font-medium">
          {current?.spaceName ?? '선택한 공간'}의 소음 기록
        </h2>
        <p className="mt-3 max-w-[760px] text-[13px] leading-6 text-ink-700">
          가장 최근 측정값으로 현재 상태를 확인하고, 최근 24시간 변화와 최근 7일의 시간대별 평균을
          비교해 머물기 좋은 시간을 찾아보세요.
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
                {space.spaceName} · {spaceTypeLabels[space.spaceType]}
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
                eyebrow="LATEST MEASUREMENT · 가장 최근 측정"
                title={`${current?.spaceName ?? '공간'}의 최근 소음`}
              />
              <div className="mt-[18px] grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
                <article className="h-[252px] rounded-sm bg-navy-900 p-8 text-white">
                  <p className="text-[10px] font-medium tracking-[1.5px] text-gold-300">
                    {current ? spaceTypeLabels[current.spaceType] : '측정 중'} · 최근 측정
                  </p>
                  <strong className="mt-2 block font-display text-[66px] font-medium leading-[78px]">
                    {loading ? '…' : (current?.decibel.toFixed(1) ?? '—')}{' '}
                    <small className="font-sans text-xs font-normal text-white/70">dB</small>
                  </strong>
                  <QuietnessBadge level={current?.level} />
                  <p className="mt-3 text-[10px] leading-5 text-white/65">
                    {current
                      ? `${timeLabel(current.measuredAt)}에 등록된 마지막 값입니다.`
                      : '아직 등록된 측정값이 없습니다.'}
                  </p>
                </article>
                <article className="h-[252px] border border-ivory-200 bg-white p-7">
                  <h3 className="text-lg font-medium">최근 24시간 요약</h3>
                  <Metric
                    label="평균"
                    value={history.length ? `${historyAverage.toFixed(1)} dB` : '—'}
                  />
                  <Metric
                    label="최저 / 최고"
                    value={
                      history.length
                        ? `${historyMinimum.toFixed(1)} / ${historyMaximum.toFixed(1)} dB`
                        : '—'
                    }
                  />
                  <Metric
                    label="등록된 측정값"
                    value={`${new Intl.NumberFormat('ko-KR').format(history.length)}개`}
                  />
                </article>
              </div>
            </div>
          </section>

          <section className="py-11">
            <div className="mx-auto max-w-[1240px] px-6 md:px-12">
              <SectionHeading eyebrow="최근 24시간" title="소음이 어떻게 변했나요?" />
              <div className="mt-4">
                <article className="min-h-[348px] border border-ivory-200 bg-white px-7 py-6">
                  <h3 className="text-lg font-medium">시간 순서로 본 데시벨 변화</h3>
                  <p className="mt-2 text-xs text-ink-700">선이 아래로 내려갈수록 더 조용합니다.</p>
                  <HistoryChart points={history} />
                </article>
              </div>
            </div>
          </section>

          <section className="bg-canvas py-10">
            <div className="mx-auto max-w-[1240px] px-6 md:px-12">
              <SectionHeading
                eyebrow="최근 7일 · 실제 측정 기록 기준"
                title="하루 중 언제 가장 조용했나요?"
              />
              <div className="mt-5 grid gap-5 lg:grid-cols-[820px_400px]">
                <article className="h-[310px] border border-ivory-200 bg-white px-7 py-6">
                  <h3 className="text-lg font-medium">시간대별 평균 데시벨</h3>
                  <p className="mt-2 text-xs text-ink-700">막대가 낮을수록 조용한 시간입니다.</p>
                  <div className="mt-5 flex h-[200px] items-end justify-around gap-3 overflow-hidden px-2 pb-6">
                    {hourlyByTimeOfDay.length === 0 && (
                      <p className="m-auto text-xs text-ink-700">
                        최근 7일에 등록된 측정값이 없습니다.
                      </p>
                    )}
                    {hourlyByTimeOfDay.map((item) => (
                      <div
                        className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                        key={item.hour}
                      >
                        <span className="text-[9px] font-medium text-ink-700">
                          {item.averageDecibel.toFixed(1)}
                        </span>
                        <span
                          className={
                            item === quietestTimeOfDay ? 'w-12 bg-navy-900' : 'w-12 bg-gold-300'
                          }
                          style={{
                            height: `${36 + ((item.averageDecibel - hourlyMinimum) / hourlyRange) * 108}px`,
                          }}
                          title={`${item.averageDecibel.toFixed(1)} dB`}
                        />
                        <span className="text-[9px] text-ink-700">{hourOfDayLabel(item.hour)}</span>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="h-[310px] border border-ivory-200 bg-white px-7 py-6">
                  <p className="text-[9px] font-medium tracking-[1.3px] text-gold-500">집계 결과</p>
                  <p className="mt-3 font-display text-[31px] font-medium">
                    {quietestTimeOfDay ? hourOfDayLabel(quietestTimeOfDay.hour) : '—'}
                  </p>
                  <p className="mt-4 text-xs leading-5 text-ink-700">
                    {quietestTimeOfDay
                      ? `최근 7일에 저장된 기록을 같은 시간대끼리 묶었을 때 평균 ${quietestTimeOfDay.averageDecibel.toFixed(1)} dB로 가장 낮았습니다.`
                      : '시간대별 측정값을 기다리고 있습니다.'}
                  </p>
                  <p className="mt-5 border-t border-ivory-200 pt-4 text-[10px] leading-5 text-ink-700">
                    DB 측정 기록 {totalHourlySamples}개 · 확인된 시간대 {hourlyByTimeOfDay.length}개
                    {totalHourlySamples > 0 && totalHourlySamples < 24
                      ? ' · 아직 기록이 적어 참고용으로만 확인해 주세요.'
                      : ''}
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
      <div className="grid h-[244px] place-items-center text-center text-xs leading-6 text-ink-700">
        <p>
          최근 24시간에 등록된 측정값이 없습니다.
          <br />새 값이 등록되면 시간 순서대로 이곳에 표시됩니다.
        </p>
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
