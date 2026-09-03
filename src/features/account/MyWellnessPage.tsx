import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import { wellnessApi } from '../wellness/api'
import type { WellnessHistory } from '../wellness/types'
import { formatDateTime, levelLabel, stayStageLabel } from '../wellness/wellnessFormat'
import { AccountLayout, HeroAction } from './AccountLayout'

/**
 * 계정 영역 안에서 보는 마음 기록.
 *
 * 계정 메뉴의 '마음 기록'은 /wellness/history 로 걸려 있었다. 그 화면은 계정 셸 밖의
 * 독립 페이지라, 누르는 순간 사이드바가 사라지고 전혀 다른 화면으로 튕기는 것처럼 보였다.
 * 목록 자체는 여기서 계정 레이아웃 안에 두고, 여정 전체를 보는 /wellness/history 는 그대로 남긴다.
 */
export function MyWellnessPage() {
  const [history, setHistory] = useState<WellnessHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    wellnessApi
      .history()
      .then((data) => active && setHistory(data))
      .catch(
        (cause: unknown) =>
          active &&
          setError(cause instanceof Error ? cause.message : '기록을 불러오지 못했습니다.'),
      )
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const latest = history[0]

  return (
    <AccountLayout
      description="숙박 전후로 남긴 마음 상태를 모아 봅니다. 기록은 본인만 볼 수 있습니다."
      eyebrow="MY WELLNESS"
      hero={<HeroAction badge="CHECK" label="새로 기록하기" to="/wellness/check" />}
      title="마음 기록"
    >
      <article className="rounded-xl border border-border-subtle bg-white px-8 py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="font-display text-[28px] leading-[34px] font-medium text-navy-900">
              최근 기록
            </h2>
            <p className="text-[10px] tracking-[0.08em] text-muted">
              {latest
                ? `가장 최근 기록은 ${formatDateTime(latest.checkedAt)} 입니다.`
                : '아직 남긴 기록이 없습니다.'}
            </p>
          </div>
          <Link
            className="text-[11px] font-medium tracking-[0.08em] text-navy-900"
            to="/wellness/history"
          >
            전체 흐름 보기 →
          </Link>
        </div>
        <span className="my-4 block h-px w-full bg-border-subtle" />

        {error && (
          <p className="text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
        {!error && loading && (
          <p className="py-10 text-center text-[13px] text-muted" role="status">
            기록을 불러오는 중입니다…
          </p>
        )}
        {!error && !loading && history.length === 0 && (
          <div className="grid justify-items-center gap-4 py-10 text-center">
            <p className="text-[13px] text-muted">
              첫 기록을 남기면 머무는 동안의 변화를 함께 볼 수 있어요.
            </p>
            <Link to="/wellness/check">
              <Button size="sm">마음 기록 시작하기</Button>
            </Link>
          </div>
        )}
        {!error && !loading && history.length > 0 && (
          <ul className="grid gap-0">
            {history.slice(0, 8).map((item) => (
              <li
                className="grid gap-2 border-b border-border-subtle py-4 last:border-0 md:grid-cols-[1.2fr_0.8fr_1fr_auto] md:items-center"
                key={item.checkId}
              >
                <span className="text-[13px] text-navy-900">{formatDateTime(item.checkedAt)}</span>
                <span className="w-fit rounded-full bg-subtle px-3 py-1 text-[11px] text-secondary">
                  {stayStageLabel[item.stayStage]}
                </span>
                <span className="text-[13px] text-navy-900">
                  {item.totalScore}점 · {levelLabel[item.level]}
                </span>
                <Link
                  className="text-[11px] font-medium tracking-[0.08em] text-gold-500 md:justify-self-end"
                  to={`/wellness/result/${item.checkId}`}
                >
                  결과 보기 →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>
    </AccountLayout>
  )
}
