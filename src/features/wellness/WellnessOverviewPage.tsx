import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { quietnessApi, wellnessApi } from './api'
import { ScoreDisc, SectionLabel, TrendChart } from './WellnessShared'
import { formatDateTime, levelLabel, quietnessLabel, toLocalDateTime } from './wellnessFormat'
import type {
  HourlyQuietness,
  QuietnessSummary,
  SpaceQuietness,
  WellnessHistory,
  WellnessTrendPoint,
} from './types'
import { useWellnessMember } from './useWellnessMember'

export function WellnessOverviewPage() {
  const { isMember } = useWellnessMember()
  const [summary, setSummary] = useState<QuietnessSummary | null>(null)
  const [spaces, setSpaces] = useState<SpaceQuietness[]>([])
  const [hourly, setHourly] = useState<HourlyQuietness[]>([])
  const [history, setHistory] = useState<WellnessHistory[]>([])
  const [trend, setTrend] = useState<WellnessTrendPoint[]>([])
  const [quietnessError, setQuietnessError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([quietnessApi.summary(), quietnessApi.spaces()])
      .then(([summaryData, spaceData]) => {
        if (!active) return
        setSummary(summaryData)
        setSpaces(spaceData)
        const quietest = [...spaceData].sort((a, b) => a.decibel - b.decibel)[0]
        if (!quietest) return
        const to = new Date()
        const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)
        return quietnessApi.hourly(quietest.spaceId, toLocalDateTime(from), toLocalDateTime(to))
      })
      .then((data) => active && data && setHourly(data))
      .catch(() => active && setQuietnessError('조용함 데이터를 아직 불러올 수 없습니다.'))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isMember) return
    let active = true
    Promise.all([wellnessApi.history(), wellnessApi.trend()])
      .then(([historyData, trendData]) => {
        if (!active) return
        setHistory(historyData)
        setTrend(trendData)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [isMember])

  const latest = history[0]
  const first = trend[0]
  const improvement = first && latest ? first.totalScore - latest.totalScore : null
  const quietest = useMemo(() => [...spaces].sort((a, b) => a.decibel - b.decibel)[0], [spaces])
  const chartData = trend.length ? trend : latest ? [{ ...latest }] : []
  const displaySpaces = spaces.slice(0, 4)

  return (
    <main>
      <section className="bg-subtle">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-16 md:grid-cols-[1.2fr_0.8fr] md:items-center md:px-12 md:py-20">
          <div>
            <SectionLabel>YOUR WELLNESS STAY · 오늘의 마음</SectionLabel>
            <h1 className="mt-5 max-w-[620px] font-display text-6xl leading-[0.92] tracking-[-0.035em] md:text-[70px]">
              How quiet is your
              <br />
              mind today?
            </h1>
            <p className="mt-6 text-sm leading-7 text-secondary">
              잠시 멈춰 지금의 마음을 살펴보세요. 10개의 짧은 질문으로
              <br className="hidden md:block" />
              오늘의 긴장과 피로를 기록하고, 머무는 동안의 변화를 확인할 수 있습니다.
            </p>
            <p className="mt-6 text-xs text-muted">
              ※ 의료적 진단이 아닌 웰니스 목적의 자기 기록입니다.
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-navy-900 px-6 text-xs font-medium tracking-[0.05em] text-white transition hover:bg-navy-700"
              to="/wellness/check"
            >
              CHECK TODAY’S MIND
            </Link>
          </div>
          <div className="justify-self-center md:justify-self-end">
            <ScoreDisc
              score={latest?.totalScore ?? null}
              label={latest ? levelLabel[latest.level] : '체크 전'}
              eyebrow="TODAY · YOUR RECORD"
              note={
                latest ? `${formatDateTime(latest.checkedAt)} 기록` : '오늘의 마음을 기록해 보세요'
              }
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 py-20 md:px-12 md:py-28">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <SectionLabel>YOUR CHANGE · 나의 변화</SectionLabel>
            <h2 className="mt-4 font-display text-[44px] leading-none">
              A quieter rhythm, day by day
            </h2>
          </div>
          {latest && (
            <span className="text-xs text-muted">
              최근 측정 · {formatDateTime(latest.checkedAt)}
            </span>
          )}
        </div>
        <div className="mt-9 grid gap-6 md:grid-cols-[1.7fr_0.9fr]">
          <article className="rounded-lg border border-border-subtle bg-white p-7 md:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-medium">마음 부담도 변화</h3>
                <p className="mt-1 text-xs text-muted">낮을수록 더 편안한 상태예요</p>
              </div>
              {improvement != null && (
                <span className="rounded-full bg-subtle px-4 py-2 text-xs text-gold-500">
                  {improvement > 0 ? `−${improvement} 좋아졌어요` : '현재 흐름을 기록 중'}
                </span>
              )}
            </div>
            {chartData.length ? (
              <TrendChart points={chartData} />
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted">
                로그인 후 첫 마음 체크를 완료하면 변화가 표시됩니다.
              </div>
            )}
          </article>
          <article className="flex min-h-[360px] flex-col justify-between rounded-lg bg-navy-900 p-8 text-white">
            <div>
              <SectionLabel>RECOMMENDED FOR YOU</SectionLabel>
              <span className="mt-7 block font-display text-5xl text-gold-300">☾</span>
              <h3 className="mt-4 font-display text-4xl">10분 호흡 명상</h3>
              <p className="mt-5 text-sm leading-7 text-white/70">
                생각이 많아 쉬기 어려운 오늘,
                <br />
                호흡의 속도를 낮추는 짧은 세션을 권해요.
              </p>
            </div>
            <Link
              className="mt-8 w-fit rounded-sm bg-white px-6 py-3 text-xs font-medium tracking-[0.04em] text-navy-900"
              to="/programs"
            >
              START MEDITATION
            </Link>
          </article>
        </div>
      </section>

      <section className="bg-subtle">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-12 md:py-24">
          <div className="flex items-end justify-between">
            <div>
              <SectionLabel>LIVE QUIETNESS · 지금의 고요</SectionLabel>
              <h2 className="mt-4 font-display text-[44px] leading-none">
                Find the quietest place, right now
              </h2>
            </div>
            {summary?.latestMeasuredAt && (
              <span className="hidden rounded-full bg-white px-4 py-2 text-[10px] tracking-[0.16em] text-gold-500 md:block">
                ● LIVE ·{' '}
                {new Date(summary.latestMeasuredAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
          {quietnessError ? (
            <div className="mt-10 rounded-lg border border-dashed border-gold-300 bg-white p-12 text-center text-sm text-muted">
              {quietnessError}
              <br />
              백엔드에서 Quietness 데모 데이터를 켜면 실시간 값이 표시됩니다.
            </div>
          ) : (
            <div className="mt-10 grid gap-5 lg:grid-cols-[0.85fr_1.25fr_0.75fr]">
              <article className="rounded-lg bg-navy-900 p-8 text-white">
                <SectionLabel>STAY SEOMING · 종합</SectionLabel>
                <strong className="mt-9 block font-display text-6xl font-normal">
                  {summary?.averageDecibel?.toFixed(1) ?? '—'}{' '}
                  <small className="font-sans text-sm text-white/50">dB</small>
                </strong>
                <h3 className="mt-5 text-2xl">
                  {summary ? quietnessLabel[summary.level] : '측정 중'}
                </h3>
                <p className="mt-6 text-xs leading-6 text-white/60">
                  {summary?.measuredSpaceCount ?? 0}개 공간의 최신 측정값 평균입니다.
                  <br />
                  지금 가장 편안한 공간을 찾아보세요.
                </p>
                {quietest && (
                  <div className="mt-7 rounded-md bg-white/8 p-5 text-xs text-white/65">
                    <span>지금 가장 조용한 공간</span>
                    <strong className="mt-2 block text-base text-white">
                      {quietest.spaceName} · {quietest.decibel.toFixed(1)} dB
                    </strong>
                  </div>
                )}
              </article>
              <article className="rounded-lg border border-border-subtle bg-white p-7">
                <h3 className="text-xl font-medium">공간별 조용함</h3>
                <div className="mt-7 space-y-8">
                  {displaySpaces.map((space) => (
                    <div key={space.spaceId}>
                      <div className="flex justify-between text-xs">
                        <span>
                          {space.spaceName} · {quietnessLabel[space.level]}
                        </span>
                        <b>{space.decibel.toFixed(1)} dB</b>
                      </div>
                      <div className="mt-3 h-1 rounded-full bg-subtle">
                        <i
                          className="block h-full rounded-full bg-gold-500"
                          style={{ width: `${Math.max(8, Math.min(100, space.decibel))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {!displaySpaces.length && (
                    <p className="py-16 text-center text-sm text-muted">
                      공간 측정값을 기다리고 있습니다.
                    </p>
                  )}
                </div>
              </article>
              <article className="rounded-lg border border-border-subtle bg-white p-7">
                <h3 className="text-xl font-medium">조용한 시간대</h3>
                <div className="mt-8 flex h-28 items-end justify-between gap-2 border-b border-border-subtle px-2">
                  {(hourly.length ? hourly.slice(-7) : [29, 31, 34, 33, 27, 25, 28]).map(
                    (item, index) => {
                      const value = typeof item === 'number' ? item : item.averageDecibel
                      return (
                        <i
                          className={`w-full rounded-t-sm ${index === 2 || index === 3 ? 'bg-navy-900' : 'bg-gold-300'}`}
                          key={typeof item === 'number' ? index : item.hourStart}
                          style={{ height: `${Math.max(20, 105 - value)}%` }}
                        />
                      )
                    },
                  )}
                </div>
                <p className="mt-8 font-display text-2xl">22:00 — 07:00</p>
                <p className="mt-5 text-xs leading-6 text-muted">
                  평균 29–33 dB로 가장 고요해요.
                  <br />
                  새벽 명상이나 독서에 권합니다.
                </p>
              </article>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
