import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { wellnessApi } from './api'
import { SectionLabel, TrendChart } from './WellnessShared'
import { formatDate, formatDateTime, levelLabel, stayStageLabel } from './wellnessFormat'
import type { WellnessHistory, WellnessTrendPoint } from './types'
import { useWellnessMember } from './useWellnessMember'

export function WellnessHistoryPage() {
  const { isMember } = useWellnessMember()
  const [history, setHistory] = useState<WellnessHistory[]>([])
  const [trend, setTrend] = useState<WellnessTrendPoint[]>([])
  const [loading, setLoading] = useState(isMember)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isMember) return
    let active = true
    Promise.all([wellnessApi.history(), wellnessApi.trend()])
      .then(([historyData, trendData]) => {
        if (!active) return
        setHistory(historyData)
        setTrend(trendData)
      })
      .catch(
        (caught: unknown) =>
          active &&
          setError(caught instanceof Error ? caught.message : '기록을 불러오지 못했습니다.'),
      )
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [isMember])

  const latest = history[0]
  const first = trend[0]
  const improvement = first && latest ? first.totalScore - latest.totalScore : 0
  const improvementRate =
    first && improvement > 0 ? Math.round((improvement / first.totalScore) * 100) : 0
  const best = useMemo(
    () => (history.length ? [...history].sort((a, b) => a.totalScore - b.totalScore)[0] : null),
    [history],
  )

  if (!isMember) {
    return (
      <main className="mx-auto max-w-[900px] px-6 py-28 text-center">
        <SectionLabel>MY WELLNESS JOURNEY</SectionLabel>
        <h1 className="mt-5 font-display text-5xl">나의 기록은 로그인 후 볼 수 있어요.</h1>
        <p className="mt-5 text-sm leading-7 text-muted">
          회원으로 체크하면 숙박 전부터 머무는 동안의 변화가 안전하게 저장됩니다.
        </p>
        <Link
          className="mt-8 inline-flex rounded-sm bg-navy-900 px-7 py-4 text-xs text-white"
          to="/login"
        >
          LOGIN TO VIEW
        </Link>
      </main>
    )
  }

  return (
    <main>
      <section className="bg-subtle">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-16 md:grid-cols-[1fr_350px] md:items-center md:px-12">
          <div>
            <SectionLabel>MY WELLNESS JOURNEY · 나의 기록</SectionLabel>
            <h1 className="mt-5 font-display text-6xl leading-none">The shape of your quiet</h1>
            <p className="mt-6 text-sm leading-7 text-secondary">
              숙박 전부터 지금까지 기록한 마음의 변화를 살펴보세요.
              <br />
              점수가 낮아질수록 몸과 마음이 더 편안해지고 있다는 뜻입니다.
            </p>
            <p className="mt-5 text-xs text-muted">
              ※ 의료적 진단이 아닌 웰니스 목적의 자기 기록입니다.
            </p>
          </div>
          <article className="rounded-lg bg-navy-900 p-7 text-white">
            <SectionLabel>CURRENT JOURNEY · 진행 중</SectionLabel>
            <p className="mt-6 font-display text-2xl">
              {trend.length
                ? `${formatDate(trend[0].checkedAt)} — ${formatDate(trend[trend.length - 1].checkedAt)}`
                : '첫 기록을 기다리는 중'}
            </p>
            <dl className="mt-7 grid grid-cols-3 gap-5">
              <div>
                <dd className="font-display text-2xl">{history.length}</dd>
                <dt className="mt-1 text-[10px] text-white/50">기록</dt>
              </div>
              <div>
                <dd className="font-display text-2xl">
                  {improvement > 0 ? `−${improvement}` : '—'}
                </dd>
                <dt className="mt-1 text-[10px] text-white/50">변화</dt>
              </div>
              <div>
                <dd className="font-display text-2xl">{trend.length}</dd>
                <dt className="mt-1 text-[10px] text-white/50">체크</dt>
              </div>
            </dl>
            <Link
              className="mt-7 inline-flex text-xs font-medium tracking-[0.04em] text-white"
              to="/wellness/check"
            >
              CHECK TODAY →
            </Link>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 py-20 md:px-12">
        <div className="mb-7 flex gap-2">
          <span className="rounded-full bg-navy-900 px-5 py-3 text-[10px] tracking-[0.1em] text-white">
            CURRENT JOURNEY
          </span>
          <span className="rounded-full bg-subtle px-5 py-3 text-[10px] tracking-[0.1em] text-secondary">
            ALL HISTORY
          </span>
        </div>
        {loading && (
          <div className="py-28 text-center text-sm text-muted">
            나의 웰니스 기록을 불러오는 중입니다…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-error-border bg-white p-10 text-center text-sm text-error">
            {error}
          </div>
        )}
        {!loading && !error && history.length === 0 && (
          <div className="rounded-lg border border-dashed border-gold-300 p-16 text-center">
            <p className="text-sm text-muted">아직 저장된 마음 기록이 없습니다.</p>
            <Link
              className="mt-6 inline-flex rounded-sm bg-navy-900 px-6 py-4 text-xs text-white"
              to="/wellness/check"
            >
              첫 체크 시작하기
            </Link>
          </div>
        )}
        {history.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_0.72fr]">
            <article className="rounded-lg border border-border-subtle bg-white p-7 md:p-9">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-medium">마음 부담도 변화</h2>
                  <p className="mt-2 text-xs text-muted">낮을수록 더 편안한 상태입니다</p>
                </div>
                {improvement > 0 && (
                  <span className="h-fit rounded-full bg-subtle px-4 py-2 text-xs text-gold-500">
                    −{improvement} · {improvementRate}% 개선
                  </span>
                )}
              </div>
              <TrendChart points={trend} />
            </article>
            <article className="rounded-lg bg-navy-900 p-7 text-white">
              <SectionLabel>RECOVERY SUMMARY</SectionLabel>
              <strong className="mt-8 block font-display text-6xl font-normal">
                {improvementRate}%
              </strong>
              <p className="mt-3 text-xs text-white/60">첫 기록 대비 마음 부담도 개선</p>
              <dl className="mt-8 space-y-7 border-t border-white/15 pt-7 text-xs">
                <div>
                  <dt className="text-white/50">가장 큰 변화</dt>
                  <dd className="mt-2 flex justify-between">
                    <span>첫 기록 → 최근 기록</span>
                    <b>{improvement > 0 ? `−${improvement}` : '—'}</b>
                  </dd>
                </div>
                <div>
                  <dt className="text-white/50">가장 편안한 기록</dt>
                  <dd className="mt-2 flex justify-between">
                    <span>{best ? formatDateTime(best.checkedAt) : '—'}</span>
                    <b>{best?.totalScore ?? '—'}</b>
                  </dd>
                </div>
                <div>
                  <dt className="text-white/50">최근 흐름</dt>
                  <dd className="mt-2 leading-6">
                    {improvement > 0
                      ? '부담도가 낮아지는 흐름을 이어가고 있어요.'
                      : '기록이 쌓이면 회복의 흐름을 알려드릴게요.'}
                  </dd>
                </div>
              </dl>
            </article>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="bg-subtle">
          <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-12">
            <div className="flex justify-between">
              <div>
                <SectionLabel>CHECK HISTORY · 마음 기록</SectionLabel>
                <h2 className="mt-4 font-display text-[42px]">Your moments, recorded gently</h2>
              </div>
              <span className="self-end text-xs text-muted">
                전체 {history.length}회 · 최근 기록
              </span>
            </div>
            <div className="mt-9 grid gap-5 lg:grid-cols-[1.6fr_0.8fr]">
              <div className="rounded-lg border border-border-subtle bg-white px-6">
                <div className="hidden grid-cols-[1.1fr_0.8fr_1fr_0.7fr] border-b border-border-subtle py-5 text-[10px] tracking-[0.12em] text-muted md:grid">
                  <span>측정 시점</span>
                  <span>숙박 단계</span>
                  <span>점수 / 상태</span>
                  <span />
                </div>
                {history.slice(0, 8).map((item) => (
                  <div
                    className="grid gap-3 border-b border-border-subtle py-6 last:border-0 md:grid-cols-[1.1fr_0.8fr_1fr_0.7fr] md:items-center"
                    key={item.checkId}
                  >
                    <span className="text-xs">{formatDateTime(item.checkedAt)}</span>
                    <span className="w-fit rounded-full bg-subtle px-4 py-2 text-[10px]">
                      {stayStageLabel[item.stayStage]}
                    </span>
                    <span className="font-display text-lg">
                      {item.totalScore} ·{' '}
                      <b className="font-sans text-sm">{levelLabel[item.level]}</b>
                    </span>
                    <Link
                      className="text-xs font-medium text-gold-500"
                      to={`/wellness/result/${item.checkId}`}
                    >
                      VIEW DETAIL
                    </Link>
                  </div>
                ))}
              </div>
              <aside className="rounded-lg border border-border-subtle bg-white p-7">
                <h3 className="text-2xl font-medium">기록 안내</h3>
                <p className="mt-5 text-sm leading-7 text-muted">
                  현재 API는 검사별 숙박 단계와 흐름을 제공합니다. 예약과 연결된 이전 숙박 묶음
                  비교는 다음 단계에서 확장할 수 있어요.
                </p>
                <Link
                  className="mt-8 inline-flex text-xs font-medium text-gold-500"
                  to="/wellness/check"
                >
                  ADD TODAY’S CHECK →
                </Link>
              </aside>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
