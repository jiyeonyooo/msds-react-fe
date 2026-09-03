import { useEffect, useState } from 'react'
import {
  AdminEmptyState,
  AdminPageHeading,
  AdminPanel,
  AdminSummaryCard,
  Notice,
} from '../../admin/shared'
import { adminWellnessApi } from './api'
import type { AdminWellnessStatistics } from './types'

const periods = [7, 30, 90] as const

const stageLabels = {
  BEFORE_STAY: '숙박 전',
  DURING_STAY: '숙박 중',
  AFTER_STAY: '숙박 후',
  GENERAL: '일반',
} as const

/** 점수 축은 0–100 고정이다. 데이터에 따라 축이 늘었다 줄면 기간을 바꿀 때마다 막대 길이가 거짓말을 한다. */
const scaleMax = 100
const gridLines = [25, 50, 75]

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
  const change = statistics?.afterStayAverageChange ?? 0

  return (
    <section>
      <AdminPageHeading
        action={
          <label className="text-sm font-medium text-slate-700">
            통계 기간
            <select
              className="mt-2 block h-11 min-w-[140px] rounded-sm border border-slate-300 bg-white px-3 text-sm"
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
          </label>
        }
        description="숙박객 전체의 마음상태 점수와 숙박 단계별 변화를 개인 식별정보 없이 집계합니다."
        eyebrow="ANONYMIZED WELLNESS OVERVIEW"
        title="웰니스 통계"
      />

      {error && <Notice error>{error}</Notice>}
      {!loading && !error && suppressed && (
        <Notice>
          개인정보 보호를 위해 참여 회원이 최소 {statistics?.minimumMembers ?? 5}명 이상일 때만 집계
          통계를 표시합니다.
        </Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="웰니스 핵심 지표">
        <AdminSummaryCard
          caption={`최근 ${period}일 · 비식별 집계`}
          label="평균 마음상태 점수"
          value={loading ? '…' : displayNumber(statistics?.averageScore ?? 0, hasData)}
        />
        <AdminSummaryCard
          caption={`참여 회원 ${statistics?.uniqueMembers ?? 0}명 · 비식별 검사 건수`}
          label="참여 기록"
          unit="건"
          value={loading ? '…' : (statistics?.totalChecks ?? 0)}
        />
        <AdminSummaryCard
          caption="숙박 전 → 숙박 후 · 낮아질수록 개선"
          emphasis={hasData && change < 0}
          label="숙박 후 평균 변화"
          value={loading ? '…' : hasData ? `${change > 0 ? '+' : ''}${change}` : '—'}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <AdminPanel meta="점수가 낮을수록 편안한 상태 · 0–100" title="숙박 단계별 평균 점수">
          {stages.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">집계된 단계가 없습니다.</p>
          ) : (
            <div>
              {/* 막대 길이는 눈금(0–100)에만 비례한다. 값 라벨 자리는 축에서 빼 두어
                  100점짜리 막대가 라벨을 밀어내지 않게 한다. */}
              <div className="relative h-[200px]">
                {gridLines.map((value) => (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 z-0 border-t border-dashed border-slate-200"
                    key={value}
                    style={{ bottom: `calc((100% - 1.5rem) * ${value / scaleMax})` }}
                  />
                ))}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 z-0 border-t border-slate-300"
                />
                <div className="relative z-10 flex h-full items-end justify-around gap-2">
                  {stages.map((item) => {
                    const measured = item.count > 0
                    const ratio = measured ? Math.max(0.02, item.averageScore / scaleMax) : 0
                    return (
                      <div
                        className="flex h-full w-full max-w-[104px] flex-col items-center justify-end"
                        key={item.stage}
                        title={`${stageLabels[item.stage]} · 평균 ${measured ? item.averageScore : '측정 없음'} · ${item.count}건`}
                      >
                        <span className="h-6 text-sm font-semibold text-[#172b44]">
                          {measured ? item.averageScore : '—'}
                        </span>
                        <span
                          className={`w-14 rounded-t-[4px] ${item.stage === 'AFTER_STAY' ? 'bg-[#a77f3b]' : 'bg-[#172b44]'}`}
                          style={{ height: `calc((100% - 1.5rem) * ${ratio})` }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="mt-2 flex justify-around gap-2">
                {stages.map((item) => (
                  <span
                    className="w-full max-w-[104px] text-center text-xs text-slate-600"
                    key={item.stage}
                  >
                    {stageLabels[item.stage]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </AdminPanel>

        <AdminPanel meta={`최근 ${period}일`} title="마음상태 수준 분포">
          {levels.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">집계된 분포가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {levels.map((item) => (
                <ProgressRow
                  accent={item.level === 'NORMAL'}
                  key={item.level}
                  label={item.label}
                  suffix="%"
                  value={item.percentage}
                />
              ))}
            </div>
          )}
        </AdminPanel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <AdminPanel meta="0–100 · 낮을수록 편안" title="카테고리별 평균">
          {categories.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">집계된 카테고리가 없습니다.</p>
          ) : (
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {categories.map((item) => (
                <ProgressRow
                  accent={item.category === 'OVERALL'}
                  key={item.category}
                  label={item.category}
                  value={item.averageScore}
                />
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="통계 제공 원칙">
          <ul className="m-0 grid list-none gap-3 p-0 text-sm leading-6 text-slate-600">
            <li>· 최소 집계 인원 기준을 적용합니다.</li>
            <li>· 이름·연락처 등 식별정보는 집계에서 제외합니다.</li>
            <li>· 의료 진단이 아닌 웰니스 참고 정보입니다.</li>
          </ul>
          <p className="mt-4 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
            기간·단계·카테고리 기준의 관리자 집계 API와 실제 데이터가 연결되어 있습니다.
          </p>
        </AdminPanel>
      </div>

      {!loading && !error && !hasData && !suppressed && (
        <div className="mt-4">
          <AdminEmptyState>
            아직 저장된 회원 웰니스 검사 기록이 없어 지표를 0 또는 빈 값으로 표시합니다.
          </AdminEmptyState>
        </div>
      )}
    </section>
  )
}

/** 값을 항상 숫자로도 적는다. 색만으로 크기를 읽게 두지 않는다. */
function ProgressRow({
  label,
  value,
  accent = false,
  suffix = '',
}: {
  label: string
  value: number
  accent?: boolean
  suffix?: string
}) {
  const safeValue = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-600">
          {safeValue.toFixed(safeValue % 1 === 0 ? 0 : 1)}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <span
          className={`block h-full rounded-full ${accent ? 'bg-[#a77f3b]' : 'bg-[#172b44]'}`}
          style={{ width: `${safeValue}%` }}
          title={`${label} ${safeValue}${suffix}`}
        />
      </div>
    </div>
  )
}
