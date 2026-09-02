import { useEffect, useState } from 'react'
import { adminWellnessApi } from './api'
import type { AdminWellnessStatistics } from './types'

const periods = [7, 30, 90] as const

const stageLabels = {
  BEFORE_STAY: 'BEFORE_STAY',
  DURING_STAY: 'DURING_STAY',
  AFTER_STAY: 'AFTER_STAY',
  GENERAL: 'GENERAL',
} as const

function isoDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date)
}

function dateRange(days: number) {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - (days - 1))
  return { fromDate: isoDate(from), toDate: isoDate(to) }
}

function displayNumber(value: number, hasData: boolean) {
  return hasData ? new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value) : '—'
}

export function AdminWellnessStatisticsPage() {
  const [period, setPeriod] = useState<(typeof periods)[number]>(30)
  const [statistics, setStatistics] = useState<AdminWellnessStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    adminWellnessApi
      .statistics(dateRange(period))
      .then((data) => active && setStatistics(data))
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : '통계를 불러오지 못했습니다.')
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [period])

  const hasData = (statistics?.totalChecks ?? 0) > 0
  const suppressed = statistics?.suppressed ?? false
  const stages = statistics?.stageAverages ?? []
  const levels = statistics?.levelDistribution ?? []
  const categories = statistics?.categoryAverages ?? []
  const categoryColumns = [categories.slice(0, 4), categories.slice(4)]

  return (
    <main className="min-h-[1020px] bg-subtle px-6 py-10 lg:px-12">
      <section className="mx-auto max-w-[1084px]">
        <div className="flex min-h-28 flex-col justify-between gap-6 bg-white py-4 lg:flex-row lg:items-center lg:py-0">
          <div>
            <p className="text-[10px] font-medium tracking-[1.6px] text-gold-500">
              ANONYMIZED WELLNESS OVERVIEW
            </p>
            <h1 className="mt-1 text-[32px] font-medium leading-[46px] text-navy-900">
              웰니스 통계
            </h1>
            <p className="text-sm leading-5 text-ink-700">
              숙박객 전체의 마음상태 점수와 숙박 단계별 변화를 개인 식별정보 없이 집계합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <select
              aria-label="통계 기간"
              className="h-11 w-[126px] border border-gold-300 bg-white px-3.5 text-xs font-medium outline-none"
              onChange={(event) => {
                setLoading(true)
                setError('')
                setPeriod(Number(event.target.value) as (typeof periods)[number])
              }}
              value={period}
            >
              {periods.map((days) => (
                <option key={days} value={days}>
                  최근 {days}일
                </option>
              ))}
            </select>
            <div className="flex h-[76px] w-[270px] flex-col justify-center border border-gold-300 bg-white px-3.5">
              <p className="text-[10px] font-medium tracking-[1.3px] text-gold-500">
                ADMIN STATS API
              </p>
              <p className="mt-1 text-xs text-ink-700">관리자 비식별 집계 API 연결 완료</p>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="mt-5 border border-error-border bg-white p-5 text-sm text-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && suppressed && (
          <div className="mt-5 border border-gold-300 bg-white p-5 text-sm leading-6 text-ink-700">
            개인정보 보호를 위해 참여 회원이 최소 {statistics?.minimumMembers ?? 5}명 이상일 때만
            집계 통계를 표시합니다.
          </div>
        )}

        <section className="mt-5 grid gap-[23px] md:grid-cols-3" aria-label="웰니스 핵심 지표">
          <MetricCard
            footnote={`최근 ${period}일 · 비식별 집계`}
            label="평균 마음상태 점수"
            loading={loading}
            value={displayNumber(statistics?.averageScore ?? 0, hasData)}
          />
          <MetricCard
            footnote={`참여 회원 ${statistics?.uniqueMembers ?? 0}명 · 비식별 검사 건수`}
            label="참여 기록"
            loading={loading}
            value={loading ? '…' : String(statistics?.totalChecks ?? 0)}
          />
          <MetricCard
            footnote="BEFORE → AFTER · 낮아질수록 개선"
            label="숙박 후 평균 변화"
            loading={loading}
            value={
              hasData
                ? `${(statistics?.afterStayAverageChange ?? 0) > 0 ? '+' : ''}${statistics?.afterStayAverageChange ?? 0}`
                : '—'
            }
          />
        </section>

        <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,660px)_minmax(320px,400px)]">
          <article className="border border-gold-300 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">숙박 단계별 평균 점수</h2>
                <p className="mt-0.5 text-[11px] text-ink-700">
                  점수가 낮을수록 더 편안한 상태 · 실제 집계
                </p>
              </div>
              <span className="bg-subtle px-5 py-1 text-[9px] font-medium text-gold-500">LIVE</span>
            </div>
            <div className="mt-4 flex h-[242px] items-end justify-around bg-subtle px-5 pb-2 pt-3">
              {stages.map((item) => (
                <div
                  className="flex h-[210px] w-[120px] flex-col items-center justify-end gap-1.5"
                  key={item.stage}
                >
                  <strong className="text-base font-medium">
                    {item.count ? item.averageScore : '—'}
                  </strong>
                  <span
                    className={`w-[72px] ${item.stage === 'AFTER_STAY' ? 'bg-gold-500' : 'bg-navy-900'}`}
                    style={{ height: `${item.count ? Math.max(10, item.averageScore * 2) : 2}px` }}
                  />
                  <span className="text-[9px] font-medium tracking-[0.45px] text-ink-700">
                    {stageLabels[item.stage]}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-gold-300 bg-white p-6">
            <h2 className="text-lg font-medium">WellnessLevel 분포</h2>
            <p className="mt-2 text-[11px] text-ink-700">최근 {period}일 · 비식별 실제 집계</p>
            <div className="mt-4 space-y-3.5">
              {levels.map((item) => (
                <ProgressRow
                  accent={item.level === 'NORMAL'}
                  key={item.level}
                  label={item.label}
                  value={item.percentage}
                />
              ))}
            </div>
          </article>
        </section>

        <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,660px)_minmax(320px,400px)]">
          <article className="border border-gold-300 bg-white px-6 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-medium">카테고리별 평균</h2>
              <span className="text-[10px] text-ink-700">0–100 · 실제 집계</span>
            </div>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              {categoryColumns.map((column, index) => (
                <div className="space-y-2" key={index}>
                  {column.map((item) => (
                    <ProgressRow
                      accent={item.category === 'OVERALL'}
                      key={item.category}
                      label={item.category}
                      value={item.averageScore}
                    />
                  ))}
                </div>
              ))}
            </div>
          </article>

          <article className="bg-navy-900 px-[22px] py-5 text-white">
            <p className="text-[10px] font-medium tracking-[1.4px] text-gold-500">PRIVACY FIRST</p>
            <h2 className="mt-2 text-lg font-medium">통계 제공 원칙</h2>
            <ul className="mt-3 space-y-2 text-[11px] leading-[15px]">
              <li>· 최소 집계 인원 기준 적용</li>
              <li>· 이름·연락처 등 식별정보 제외</li>
              <li>· 의료 진단이 아닌 웰니스 참고 정보</li>
            </ul>
            <div className="my-3 h-px bg-gold-300" />
            <p className="text-[11px] leading-[15px]">
              기간·단계·카테고리 기준의 관리자 집계 API와 실제 데이터가 연결되어 있습니다.
            </p>
          </article>
        </section>

        {!loading && !error && !hasData && !suppressed && (
          <p className="mt-5 text-center text-xs text-ink-700">
            아직 저장된 회원 웰니스 검사 기록이 없어 지표를 0 또는 빈 값으로 표시합니다.
          </p>
        )}
      </section>
    </main>
  )
}

function MetricCard({
  label,
  value,
  footnote,
  loading,
}: {
  label: string
  value: string
  footnote: string
  loading: boolean
}) {
  return (
    <article className="flex h-36 flex-col gap-2 rounded-sm border border-gold-300 bg-white p-6">
      <div className="flex h-6 items-center justify-between">
        <p className="text-xs font-medium text-ink-700">{label}</p>
        <span className="h-0.5 w-7 bg-gold-500" />
      </div>
      <strong className="text-[34px] font-medium leading-[49px]">{loading ? '…' : value}</strong>
      <p className="text-[11px] leading-4 text-ink-700">{footnote}</p>
    </article>
  )
}

function ProgressRow({
  label,
  value,
  accent = false,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  const safeValue = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-medium">
        <span>{label}</span>
        <span className="text-ink-700">{safeValue.toFixed(safeValue % 1 === 0 ? 0 : 1)}%</span>
      </div>
      <div className="mt-1.5 h-[7px] overflow-hidden bg-subtle">
        <span
          className={`block h-full ${accent ? 'bg-gold-500' : 'bg-navy-900'}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}
