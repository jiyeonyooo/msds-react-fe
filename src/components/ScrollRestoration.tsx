import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { internalNavigationEvent, scrollLayoutReadyEvent } from '../lib/navigation'

type ScrollPosition = { left: number; top: number }
type StoredScrollPosition = ScrollPosition & { savedAt: number }
type HistoryStateWithScroll = { __msdsScrollPosition?: unknown }

const storagePrefix = 'msds:scroll-position:'

function storageKey(locationKey: string) {
  return `${storagePrefix}${locationKey}`
}

function currentUrlKey() {
  return `url:${window.location.pathname}${window.location.search}${window.location.hash}`
}

function asStoredScrollPosition(value: unknown): StoredScrollPosition | null {
  if (!value || typeof value !== 'object') return null
  const position = value as Partial<StoredScrollPosition>
  if (
    typeof position.left !== 'number' ||
    typeof position.top !== 'number' ||
    typeof position.savedAt !== 'number'
  ) {
    return null
  }
  return { left: position.left, top: position.top, savedAt: position.savedAt }
}

function readStoredPosition(key: string) {
  const stored = sessionStorage.getItem(storageKey(key))
  if (!stored) return null
  try {
    return asStoredScrollPosition(JSON.parse(stored))
  } catch {
    return null
  }
}

function savePosition(locationKey: string) {
  const position: StoredScrollPosition = {
    left: window.scrollX,
    top: window.scrollY,
    savedAt: Date.now(),
  }
  const serialized = JSON.stringify(position)
  const currentState = (window.history.state ?? {}) as HistoryStateWithScroll
  window.history.replaceState({ ...currentState, __msdsScrollPosition: position }, '')
  sessionStorage.setItem(storageKey(locationKey), serialized)
  sessionStorage.setItem(storageKey(currentUrlKey()), serialized)
}

function readPosition(locationKey: string): ScrollPosition | null {
  const historyPosition = asStoredScrollPosition(
    (window.history.state as HistoryStateWithScroll | null)?.__msdsScrollPosition,
  )
  if (historyPosition) return historyPosition

  const entryPosition = readStoredPosition(locationKey)
  if (entryPosition) return entryPosition

  return readStoredPosition(currentUrlKey())
}

/**
 * Restores positions per history entry for reloads and POP navigation. App
 * initiated navigation always starts at the top instead.
 */
export function ScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const canSavePosition = useRef(false)
  const initialLocationKey = useRef(location.key)
  const restorationTarget = useRef<{ key: string; position: ScrollPosition } | null>(null)
  const pendingInternalNavigation = useRef(false)

  useLayoutEffect(() => {
    const previousScrollRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
    return () => {
      history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  useLayoutEffect(() => {
    const saveCurrentPosition = () => {
      if (canSavePosition.current) savePosition(location.key)
    }
    const scrollToTop = () => {
      saveCurrentPosition()
      pendingInternalNavigation.current = true
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }

    window.addEventListener('scroll', saveCurrentPosition, { passive: true })
    window.addEventListener('pagehide', saveCurrentPosition)
    window.addEventListener('beforeunload', saveCurrentPosition)
    window.addEventListener(internalNavigationEvent, scrollToTop)
    return () => {
      saveCurrentPosition()
      window.removeEventListener('scroll', saveCurrentPosition)
      window.removeEventListener('pagehide', saveCurrentPosition)
      window.removeEventListener('beforeunload', saveCurrentPosition)
      window.removeEventListener(internalNavigationEvent, scrollToTop)
    }
  }, [location.key])

  useLayoutEffect(() => {
    const isInitialRender = location.key === initialLocationKey.current
    // The app's navigation helper updates history directly, which React Router
    // observes as POP. Keep it distinct from an actual browser back/forward
    // navigation so stale per-entry positions are never restored.
    const isInternalNavigation = pendingInternalNavigation.current
    pendingInternalNavigation.current = false
    if (isInternalNavigation || (!isInitialRender && navigationType !== 'POP')) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      canSavePosition.current = true
      return
    }

    const cachedTarget = restorationTarget.current
    const position =
      cachedTarget?.key === location.key ? cachedTarget.position : readPosition(location.key)
    if (!position) {
      canSavePosition.current = true
      return
    }
    restorationTarget.current = { key: location.key, position }

    const restore = () => {
      window.scrollTo({ ...position, behavior: 'auto' })
      canSavePosition.current = true
    }
    const frame = requestAnimationFrame(restore)
    // Pins change the document height after the route has rendered. Reapply
    // once their layout has settled so a restored position is not clamped.
    const afterLayout = window.setTimeout(restore, 150)
    const afterDataLoad = window.setTimeout(restore, 600)
    const resizeObserver = new ResizeObserver(restore)
    resizeObserver.observe(document.documentElement)
    const stopObserving = window.setTimeout(() => resizeObserver.disconnect(), 1000)
    window.addEventListener(scrollLayoutReadyEvent, restore)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(afterLayout)
      clearTimeout(afterDataLoad)
      clearTimeout(stopObserving)
      resizeObserver.disconnect()
      window.removeEventListener(scrollLayoutReadyEvent, restore)
    }
  }, [location.key, navigationType])

  return null
}
