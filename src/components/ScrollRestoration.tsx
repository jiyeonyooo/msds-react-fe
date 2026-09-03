import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { internalNavigationEvent, scrollLayoutReadyEvent } from '../lib/navigation'

type ScrollPosition = { left: number; top: number }
type StoredScrollPosition = ScrollPosition & { savedAt: number }

const storagePrefix = 'msds:scroll-position:'

function storageKey(locationKey: string) {
  return `${storagePrefix}${locationKey}`
}

function urlKey(pathname: string, search: string, hash: string) {
  return `url:${pathname}${search}${hash}`
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

function savePosition(locationKey: string, locationUrlKey: string) {
  const position: StoredScrollPosition = {
    left: window.scrollX,
    top: window.scrollY,
    savedAt: Date.now(),
  }
  const serialized = JSON.stringify(position)
  sessionStorage.setItem(storageKey(locationKey), serialized)
  sessionStorage.setItem(storageKey(locationUrlKey), serialized)
}

function readPosition(locationKey: string, locationUrlKey: string, preferUrl: boolean) {
  if (preferUrl) {
    const urlPosition = readStoredPosition(locationUrlKey)
    if (urlPosition) return urlPosition
  }

  const entryPosition = readStoredPosition(locationKey)
  if (entryPosition) return entryPosition

  return readStoredPosition(locationUrlKey)
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
  const pendingInternalNavigation = useRef(false)
  const locationUrlKey = urlKey(location.pathname, location.search, location.hash)

  useLayoutEffect(() => {
    const previousScrollRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
    return () => {
      history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  useLayoutEffect(() => {
    let scheduledSave = 0
    canSavePosition.current = false

    const saveCurrentPosition = () => {
      if (canSavePosition.current) savePosition(location.key, locationUrlKey)
    }
    const scheduleCurrentPositionSave = () => {
      if (!canSavePosition.current || scheduledSave) return
      scheduledSave = requestAnimationFrame(() => {
        scheduledSave = 0
        saveCurrentPosition()
      })
    }
    const flushCurrentPosition = () => {
      if (scheduledSave) {
        cancelAnimationFrame(scheduledSave)
        scheduledSave = 0
      }
      saveCurrentPosition()
    }
    const scrollToTop = () => {
      flushCurrentPosition()
      pendingInternalNavigation.current = true
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }

    window.addEventListener('scroll', scheduleCurrentPositionSave, { passive: true })
    window.addEventListener('pagehide', flushCurrentPosition)
    window.addEventListener('beforeunload', flushCurrentPosition)
    window.addEventListener(internalNavigationEvent, scrollToTop)
    return () => {
      flushCurrentPosition()
      window.removeEventListener('scroll', scheduleCurrentPositionSave)
      window.removeEventListener('pagehide', flushCurrentPosition)
      window.removeEventListener('beforeunload', flushCurrentPosition)
      window.removeEventListener(internalNavigationEvent, scrollToTop)
    }
  }, [location.key, locationUrlKey])

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

    const position = readPosition(location.key, locationUrlKey, isInitialRender)
    if (!position) {
      canSavePosition.current = true
      return
    }

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
  }, [location.key, locationUrlKey, navigationType])

  return null
}
