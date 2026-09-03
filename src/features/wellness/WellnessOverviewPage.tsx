import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '../../components/motion'
import { quietnessApi, wellnessApi } from './api'
import { QuietnessExplorer } from './QuietnessExplorer'
import { recommendWellnessNext } from './recommendation'
import { readLastResult } from './wellnessDraft'
import { ScoreDisc, SectionLabel, TrendChart } from './WellnessShared'
import {
  categoryScores,
  formatDateTime,
  levelLabel,
  quietnessLabel,
  toAnswerDetails,
} from './wellnessFormat'
import type { QuietnessSummary, SpaceQuietness, WellnessHistory, WellnessTrendPoint } from './types'
import { useWellnessMember } from './useWellnessMember'

export function WellnessOverviewPage() {
  const { isMember } = useWellnessMember()
  const [summary, setSummary] = useState<QuietnessSummary | null>(null)
  const [spaces, setSpaces] = useState<SpaceQuietness[]>([])
  const [history, setHistory] = useState<WellnessHistory[]>([])
  const [trend, setTrend] = useState<WellnessTrendPoint[]>([])
  const [quietnessError, setQuietnessError] = useState('')
  const [quietnessLoading, setQuietnessLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([quietnessApi.summary(), quietnessApi.spaces()])
      .then(([summaryData, spaceData]) => {
        if (!active) return
        setSummary(summaryData)
        setSpaces(spaceData)
      })
      .catch(() => active && setQuietnessError('조용함 데이터를 아직 불러올 수 없습니다.'))
      .finally(() => active && setQuietnessLoading(false))
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

  // 추천 문구를 고정해 두면 어떤 결과가 나와도 같은 말을 하게 된다.
  // 마지막 체크의 답변이 세션에 남아 있으면 그 카테고리로, 없으면 총점으로 방향을 정한다.
  const recommendation = useMemo(() => {
    const lastResult = readLastResult()
    const scores = categoryScores(toAnswerDetails(lastResult?.answers, lastResult?.questions))
    return recommendWellnessNext({
      scores,
      totalScore: latest?.totalScore ?? lastResult?.result?.totalScore ?? null,
      quietestSpace: quietest ?? null,
    })
  }, [latest, quietest])

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
          <div className="w-full justify-self-center overflow-visible md:flex md:justify-end">
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
              <span className="mt-7 block font-display text-5xl text-gold-300" aria-hidden="true">
                {recommendation.symbol}
              </span>
              <h3 className="mt-4 font-display text-3xl leading-tight">{recommendation.title}</h3>
              <p className="mt-5 text-sm leading-7 text-white/70">{recommendation.body}</p>
            </div>
            <Link
              className="mt-8 w-fit rounded-sm bg-white px-6 py-3 text-xs font-medium tracking-[0.04em] text-navy-900"
              to={recommendation.to}
            >
              {recommendation.ctaLabel}
            </Link>
          </article>
        </div>
      </section>

      <section className="scroll-mt-[110px] bg-subtle" id="quietness">
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

          <div className="mt-10 grid gap-5">
            <article className="grid gap-6 rounded-lg border border-border-subtle bg-white p-7 md:grid-cols-[auto_1fr] md:items-center">
              {quietnessLoading ? (
                <Skeleton className="h-16 w-40" />
              ) : (
                <div>
                  <SectionLabel>STAY OVERALL · 종합</SectionLabel>
                  <strong className="mt-3 block font-display text-5xl font-normal">
                    {summary?.averageDecibel?.toFixed(1) ?? '—'}{' '}
                    <small className="font-sans text-sm text-muted">dB</small>
                  </strong>
                  <p className="mt-2 text-sm">
                    {summary ? quietnessLabel[summary.level] : '측정 전'}
                  </p>
                </div>
              )}
              <p className="text-xs leading-6 text-muted md:justify-self-end md:text-right">
                {summary?.measuredSpaceCount ?? 0}개 공간의 최신 측정값 평균입니다.
                <br />
                아래에서 공간과 시간대를 골라 하루의 흐름을 확인해 보세요.
              </p>
            </article>

            <QuietnessExplorer error={quietnessError} loading={quietnessLoading} spaces={spaces} />
          </div>
        </div>
      </section>
    </main>
  )
}
