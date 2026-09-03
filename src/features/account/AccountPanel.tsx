import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'

/**
 * 계정 영역 목록 화면이 공유하는 흰 패널.
 *
 * 배치 원칙을 한 곳에 모아 둔다.
 * - 화면 위 네이비 히어로는 '목록으로 돌아가기'처럼 화면을 뜨는 이동에만 쓴다.
 * - 그 목록에 대한 주 동작(새 예약·새 기록·새 문의)은 패널 헤더 오른쪽에 둔다.
 *   목록을 보던 시선에서 손이 가장 가깝고, 스크롤을 되돌릴 필요가 없다.
 * - 필터처럼 목록을 좁히는 조작은 헤더 아래 자기 줄에 둔다. 주 동작과 섞이지 않는다.
 */
export function AccountPanel({
  title,
  meta,
  action,
  toolbar,
  children,
}: {
  title: string
  meta?: ReactNode
  action?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
}) {
  return (
    <article className="rounded-xl border border-border-subtle bg-white px-6 py-6 md:px-8 md:py-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-[28px] leading-[34px] font-medium text-navy-900">
            {title}
          </h2>
          {meta && <p className="mt-0.5 text-xs text-muted">{meta}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {toolbar && <div className="mt-5">{toolbar}</div>}
      <span className="my-4 block h-px w-full bg-border-subtle" />
      {children}
    </article>
  )
}

/** 패널 헤더에 놓는 주 동작 버튼. 좁은 화면에서는 가로로 꽉 채워 누르기 쉽게 한다. */
export function AccountPanelAction({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="block" to={to}>
      <Button className="w-full sm:w-auto" size="sm">
        {children}
      </Button>
    </Link>
  )
}

/** 목록이 비었을 때. 안내 문구 바로 아래에 같은 동작을 한 번 더 둔다. */
export function AccountEmptyState({
  message,
  actionLabel,
  actionTo,
}: {
  message: string
  actionLabel?: string
  actionTo?: string
}) {
  return (
    <div className="grid justify-items-center gap-5 rounded-lg border border-dashed border-gold-300 px-6 py-14 text-center">
      <p className="text-sm leading-loose text-muted">{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo}>
          <Button size="sm">{actionLabel}</Button>
        </Link>
      )}
    </div>
  )
}
