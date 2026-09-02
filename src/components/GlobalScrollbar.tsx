import { useEffect, useRef, useState, type PointerEvent } from 'react'

type ScrollMetrics = { height: number; top: number; visible: boolean }

function readMetrics(): ScrollMetrics {
  const documentHeight = document.documentElement.scrollHeight
  const viewportHeight = window.innerHeight
  const maxScroll = documentHeight - viewportHeight
  const trackHeight = viewportHeight - 8

  if (maxScroll <= 0) return { height: 0, top: 0, visible: false }

  const height = Math.min(trackHeight, Math.max(40, (viewportHeight / documentHeight) * trackHeight))
  return {
    height,
    top: (window.scrollY / maxScroll) * (trackHeight - height),
    visible: true,
  }
}

/** 루트 스크롤의 레이아웃 폭을 차지하지 않는 오버레이 스크롤 표시기. */
export function GlobalScrollbar() {
  const [metrics, setMetrics] = useState<ScrollMetrics>(() => readMetrics())
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef<number | null>(null)
  const previousScrollBehavior = useRef('')

  const scrollToPointer = (clientY: number, track: HTMLDivElement, offset = metrics.height / 2) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const rect = track.getBoundingClientRect()
    const usableTrack = rect.height - metrics.height
    if (maxScroll <= 0 || usableTrack <= 0) return
    const position = Math.min(Math.max(clientY - rect.top - offset, 0), usableTrack)
    window.scrollTo({ top: (position / usableTrack) * maxScroll, behavior: 'auto' })
  }

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    const thumbTop = event.currentTarget.getBoundingClientRect().top + metrics.top
    dragOffset.current = Math.min(Math.max(event.clientY - thumbTop, 0), metrics.height)
    previousScrollBehavior.current = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'auto'
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    scrollToPointer(event.clientY, event.currentTarget, dragOffset.current)
  }

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragOffset.current !== null) scrollToPointer(event.clientY, event.currentTarget, dragOffset.current)
  }

  const stopDrag = () => {
    dragOffset.current = null
    document.documentElement.style.scrollBehavior = previousScrollBehavior.current
    setDragging(false)
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
      className={`global-scrollbar ${hovered ? 'global-scrollbar--visible' : ''} ${dragging ? 'global-scrollbar--dragging' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onLostPointerCapture={stopDrag}
    >
      <span className="global-scrollbar__thumb" style={{ height: metrics.height, transform: `translateY(${metrics.top}px)` }} />
    </div>
  )
}
