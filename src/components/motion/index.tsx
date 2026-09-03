import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { reducedMotion, useReveal, useRevealAll, useRouteReset, useScrollRatio } from './hooks'

/** 스크롤 진입 시 드러나는 래퍼. delay로 카드들을 순차로 띄운다. */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
}: {
  as?: 'div' | 'section' | 'article' | 'li'
  delay?: number
  className?: string
  children: ReactNode
}) {
  const ref = useReveal<HTMLElement>()
  return (
    <Tag
      className={`reveal ${className}`}
      ref={ref as never}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}

/** 어느 정도 내려왔을 때만 나타나는 맨 위로 버튼. */
export function BackToTop() {
  const ratio = useScrollRatio()
  const visible = ratio > 0.3
  return (
    <button
      aria-hidden={!visible}
      className={`fixed right-5 bottom-6 z-40 grid size-11 place-items-center rounded-full border border-border-accent bg-surface text-navy-900 shadow-floating transition duration-500 ease-calm md:right-8 md:bottom-8 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      onClick={() => scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })}
      tabIndex={visible ? 0 : -1}
      type="button"
    >
      <span className="sr-only">맨 위로</span>
      <span aria-hidden="true" className="text-sm leading-none">
        ↑
      </span>
    </button>
  )
}

/**
 * 숫자를 0에서 목표값까지 훑어 올린다.
 * 값이 늦게 도착하는 화면(대시보드)에서 '숫자가 채워지는' 인상을 준다.
 */
export function CountUp({ value, duration = 1100 }: { value?: number; duration?: number }) {
  const [shown, setShown] = useState(value ?? 0)
  useEffect(() => {
    if (value === undefined) return
    if (reducedMotion()) {
      const id = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(id)
    }
    const from = 0
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      // ease-out cubic. 끝에서 천천히 멎어야 브랜드 톤과 맞는다.
      const eased = 1 - Math.pow(1 - progress, 3)
      setShown(Math.round(from + (value - from) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, value])
  if (value === undefined) return <>–</>
  return <>{shown.toLocaleString('ko-KR')}</>
}

/** 로딩 중 자리를 미리 잡아 두는 회색 블록. 레이아웃이 나중에 튀지 않는다. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-shimmer rounded-sm bg-subtle ${className}`}
    />
  )
}

/** 목록 자리를 채우는 스켈레톤 행 묶음. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-0" role="status">
      <span className="sr-only">불러오는 중입니다</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="grid gap-2 border-b border-border-subtle py-5 last:border-0 md:grid-cols-[1.3fr_1.2fr_0.9fr_auto] md:items-center"
          key={index}
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-52" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-20 md:justify-self-end" />
        </div>
      ))}
    </div>
  )
}

/**
 * 라우트가 바뀔 때 본문을 짧게 크로스페이드하고, 읽는 위치와 포커스를 처음으로 되돌린다.
 * tabIndex={-1} 은 포커스를 받기 위한 것이라 탭 순서에는 끼지 않는다.
 */
export function RouteFade({ children }: { children: ReactNode }) {
  const { hash, pathname } = useLocation()
  const container = useRef<HTMLDivElement>(null)
  useRevealAll(pathname)
  useRouteReset(pathname, hash, container)
  return (
    <div className="route-fade outline-none" key={pathname} ref={container} tabIndex={-1}>
      {children}
    </div>
  )
}

/** 카드 목록이 도착하기 전 자리를 잡아 두는 스켈레톤. 데이터가 오면 레이아웃이 튀지 않는다. */
export function SkeletonCards({
  count = 6,
  className = 'grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3',
  mediaClassName = 'h-[170px]',
}: {
  count?: number
  className?: string
  mediaClassName?: string
}) {
  return (
    <div className={className} role="status">
      <span className="sr-only">불러오는 중입니다</span>
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="overflow-hidden rounded-lg border border-border-subtle bg-white"
          key={index}
        >
          <Skeleton className={`w-full rounded-none ${mediaClassName}`} />
          <div className="grid gap-2 px-4 py-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
