import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { wellnessApi } from '../wellness/api'
import type { WellnessHistory } from '../wellness/types'
import { formatDateTime, levelLabel, stayStageLabel } from '../wellness/wellnessFormat'
import { SkeletonRows } from '../../components/motion'
import { AccountLayout } from './AccountLayout'
import { AccountEmptyState, AccountPanel, AccountPanelAction } from './AccountPanel'

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
      title="마음 기록"
    >
      <AccountPanel
        action={<AccountPanelAction to="/wellness/check">새로 기록하기</AccountPanelAction>}
        meta={
          latest
            ? `가장 최근 기록은 ${formatDateTime(latest.checkedAt)} 입니다.`
            : '아직 남긴 기록이 없습니다.'
        }
        title="최근 기록"
        toolbar={
          <Link
            className="text-[11px] font-medium tracking-[0.08em] text-navy-900"
            to="/wellness/history"
          >
            전체 흐름 보기 →
          </Link>
        }
      >
        {error && (
          <p className="text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
        {!error && loading && (
          <SkeletonRows rows={3} />
        )}
        {!error && !loading && history.length === 0 && (
          <AccountEmptyState
            actionLabel="마음 기록 시작하기"
            actionTo="/wellness/check"
            message="첫 기록을 남기면 머무는 동안의 변화를 함께 볼 수 있어요."
          />
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
      </AccountPanel>
    </AccountLayout>
  )
}
