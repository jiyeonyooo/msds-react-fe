import { useEffect, useRef, useState, type PointerEvent } from 'react'

type ScrollMetrics = { height: number; top: number; visible: boolean }

function readMetrics(): ScrollMetrics {
  const documentHeight = document.documentElement.scrollHeight
  const viewportHeight = window.innerHeight
  const maxScroll = documentHeight - viewportHeight

  if (maxScroll <= 0) return { height: 0, top: 0, visible: false }

  const height = Math.max(40, (viewportHeight / documentHeight) * viewportHeight)
  return {
    height,
    top: (window.scrollY / maxScroll) * (viewportHeight - height),
    visible: true,
  }
}

/** 루트 스크롤의 레이아웃 폭을 차지하지 않는 오버레이 스크롤 표시기. */
export function GlobalScrollbar() {
  const [metrics, setMetrics] = useState<ScrollMetrics>(() => readMetrics())
  const [hovered, setHovered] = useState(false)
  const dragOffset = useRef<number | null>(null)

  const scrollToPointer = (clientY: number, offset = metrics.height / 2) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const trackHeight = window.innerHeight - metrics.height - 8
    const position = Math.min(Math.max(clientY - 4 - offset, 0), trackHeight)
    window.scrollTo({ top: (position / trackHeight) * maxScroll, behavior: 'auto' })
  }

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    const thumbTop = metrics.top + 4
    dragOffset.current = Math.min(Math.max(event.clientY - thumbTop, 0), metrics.height)
    event.currentTarget.setPointerCapture(event.pointerId)
    scrollToPointer(event.clientY, dragOffset.current)
  }

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragOffset.current !== null) scrollToPointer(event.clientY, dragOffset.current)
  }

  useEffect(() => {
    const update = () => setMetrics(readMetrics())
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(document.documentElement)
    addEventListener('scroll', update, { passive: true })
    addEventListener('resize', update)
    update()

    return () => {
      resizeObserver.disconnect()
      removeEventListener('scroll', update)
      removeEventListener('resize', update)
    }
  }, [])

  if (!metrics.visible) return null

  return (
    <div
      aria-hidden="true"
      className={`global-scrollbar ${hovered ? 'global-scrollbar--visible' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={() => { dragOffset.current = null }}
    >
      <span className="global-scrollbar__thumb" style={{ height: metrics.height, transform: `translateY(${metrics.top}px)` }} />
    </div>
  )
}
