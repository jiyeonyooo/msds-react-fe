import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { wellnessApi } from './api'
import { recommendWellnessNext } from './recommendation'
import { readLastResult } from './wellnessDraft'
import { ScoreDisc, SectionLabel } from './WellnessShared'
import {
  categoryCopy,
  categoryScores,
  formatDateTime,
  scoreDescription,
  toAnswerDetails,
} from './wellnessFormat'
import type {
  ResultRouteState,
  WellnessAnswerDetail,
  WellnessCheckDetail,
  WellnessCheckResult,
  WellnessCategory,
} from './types'
import { useWellnessMember } from './useWellnessMember'

const cardOrder: WellnessCategory[] = ['STRESS', 'TENSION', 'FATIGUE', 'REST']

export function WellnessResultPage() {
  const { isMember } = useWellnessMember()
  const { checkId } = useParams()
  const { state } = useLocation()
  // 라우트 state 는 새로고침에서 사라진다. 서버에 기록이 없는 비회원 결과를 위해 세션 사본을 함께 본다.
  const [routeState] = useState<ResultRouteState | null>(
    () => (state as ResultRouteState | null) ?? readLastResult(),
  )
  const [detail, setDetail] = useState<WellnessCheckDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isMember || !checkId) return
    let active = true
    wellnessApi
      .detail(Number(checkId))
      .then((data) => active && setDetail(data))
      .catch(
        (caught: unknown) =>
          active &&
          setError(caught instanceof Error ? caught.message : '결과를 불러오지 못했습니다.'),
      )
    return () => {
      active = false
    }
  }, [checkId, isMember])

  const result: WellnessCheckResult | null = detail
    ? {
        checkId: detail.checkId,
        totalScore: detail.totalScore,
        level: detail.level,
        levelLabel: detail.levelLabel,
        message: detail.message,
        saved: true,
      }
    : (routeState?.result ?? null)

  const answers = useMemo<WellnessAnswerDetail[]>(() => {
    if (detail) return detail.answers
    return toAnswerDetails(routeState?.answers, routeState?.questions)
  }, [detail, routeState])

  const insightScores = categoryScores(answers)
  const fallbackScore = result?.totalScore ?? 0
  const displayedCards = cardOrder.map((category) => ({
    category,
    score: insightScores.find((item) => item.category === category)?.score ?? fallbackScore,
  }))
  // 고정 문구 대신 이번 답변에서 가장 두드러진 항목으로 다음 걸음을 고른다.
  const recommendation = recommendWellnessNext({
    scores: insightScores,
    totalScore: result?.totalScore ?? null,
  })

  if (!result && !checkId) {
    return (
      <main className="mx-auto max-w-[900px] px-6 py-28 text-center">
        <SectionLabel>YOUR MIND, AT THIS MOMENT</SectionLabel>
        <h1 className="mt-5 font-display text-5xl">아직 표시할 결과가 없어요.</h1>
        <p className="mt-5 text-sm text-muted">
          짧은 마음상태 체크를 완료하면 지금의 흐름을 보여드릴게요.
        </p>
        <Link
          className="mt-8 inline-flex rounded-sm bg-navy-900 px-6 py-4 text-xs text-white"
          to="/wellness/check"
        >
          START CHECK
        </Link>
      </main>
    )
  }

  if (!result) {
    return (
      <main className="mx-auto max-w-[900px] px-6 py-28 text-center">
        <p className="text-sm text-muted">결과를 불러오는 중입니다…</p>
        {error && <p className="mt-5 text-error">{error}</p>}
      </main>
    )
  }

  return (
    <main>
      <section className="bg-subtle">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-16 md:grid-cols-[430px_1fr] md:items-center md:px-12 md:py-20">
          <ScoreDisc
            score={result.totalScore}
            label={result.levelLabel}
            note={
              result.saved ? '✓ 나의 웰니스 기록에 저장됨' : '비회원 결과 · 서버에 저장되지 않음'
            }
          />
          <div>
            <SectionLabel>YOUR MIND, AT THIS MOMENT</SectionLabel>
            <h1 className="mt-5 text-4xl font-medium leading-tight md:text-5xl">
              {result.message.split('. ')[0]}.
            </h1>
            <p className="mt-6 text-lg leading-8 text-secondary">{result.message}</p>
            <p className="mt-5 text-xs text-muted">
              이 결과는 의료적 진단이 아닌 웰니스 목적의 참고 정보입니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {isMember && (
                <Link
                  className="rounded-sm bg-navy-900 px-6 py-4 text-xs font-medium tracking-[0.04em] text-white"
                  to="/wellness/history"
                >
                  VIEW MY HISTORY
                </Link>
              )}
              <Link
                className="rounded-sm border border-gold-300 bg-white px-6 py-4 text-xs font-medium tracking-[0.04em]"
                to="/wellness/check"
              >
                CHECK AGAIN
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 py-20 md:px-12 md:py-24">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <h2 className="text-3xl font-medium">오늘의 답변에서 보이는 흐름</h2>
          <span className="text-xs text-muted">
            {detail?.checkedAt
              ? formatDateTime(detail.checkedAt)
              : new Date().toLocaleDateString('ko-KR')}{' '}
            · {detail ? '저장된 기록' : '오늘의 체크'}
          </span>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayedCards.map(({ category, score }) => (
            <article className="rounded-lg border border-border-subtle bg-white p-6" key={category}>
              <SectionLabel>{categoryCopy[category].eyebrow}</SectionLabel>
              <h3 className="mt-4 text-lg font-medium">{categoryCopy[category].title}</h3>
              <p className="mt-8 font-display text-5xl">
                {score}
                <small className="ml-2 font-sans text-xs text-muted">/ 100</small>
              </p>
              <p className="mt-4 text-xs text-secondary">{scoreDescription(score)}</p>
              <div className="mt-5 h-1 rounded-full bg-subtle">
                <i
                  className="block h-full rounded-full bg-gold-500 transition-[width] duration-[760ms] ease-calm"
                  style={{ width: `${score}%` }}
                />
              </div>
            </article>
          ))}
        </div>
        <article className="mt-8 flex flex-col items-start justify-between gap-7 rounded-lg bg-navy-900 p-8 text-white md:flex-row md:items-center">
          <div className="flex items-center gap-7">
            <span
              aria-hidden="true"
              className="flex size-20 shrink-0 items-center justify-center rounded-full border border-gold-500 font-display text-4xl text-gold-300"
            >
              {recommendation.symbol}
            </span>
            <div>
              <SectionLabel>{recommendation.eyebrow}</SectionLabel>
              <h3 className="mt-3 text-2xl font-medium">{recommendation.title}</h3>
              <p className="mt-3 text-xs text-white/60">
                {recommendation.body} 현재 결과와 머무는 단계에 맞춘 추천입니다.
              </p>
            </div>
          </div>
          <Link
            className="shrink-0 rounded-sm bg-white px-7 py-4 text-xs font-medium text-navy-900"
            to={recommendation.to}
          >
            {recommendation.ctaLabel}
          </Link>
        </article>
      </section>
    </main>
  )
}
