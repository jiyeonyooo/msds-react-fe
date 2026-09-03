export const internalNavigationEvent = 'msds:internal-navigation'
export const scrollLayoutReadyEvent = 'msds:scroll-layout-ready'

export function navigate(path: string) {
  window.dispatchEvent(new Event(internalNavigationEvent))
  const currentState = window.history.state as { idx?: unknown } | null
  const currentIndex = typeof currentState?.idx === 'number' ? currentState.idx : -1
  window.history.pushState(
    {
      key: crypto.randomUUID(),
      idx: currentIndex + 1,
    },
    '',
    path,
  )
  window.dispatchEvent(new PopStateEvent('popstate'))
}
