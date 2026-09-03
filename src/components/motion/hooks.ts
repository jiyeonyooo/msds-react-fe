import { useEffect, useRef, useState, type RefObject } from 'react'

export const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 요소가 화면에 들어오면 한 번만 드러낸다.
 * 되돌아가며 다시 숨기지 않는다. 스크롤을 올렸다 내릴 때 깜빡이는 느낌을 주기 때문이다.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reducedMotion() || typeof IntersectionObserver !== 'function') {
      node.classList.add('is-revealed')
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        })
      },
      // 요소 아래쪽이 조금 올라온 시점에 시작해야 '이미 다 보이고 나서 뒤늦게 뜨는' 느낌이 없다.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return ref
}

/** 현재 스크롤 위치를 0~1로 돌려준다. 진행 바와 '맨 위로'가 같이 쓴다. */
export function useScrollRatio() {
  const [ratio, setRatio] = useState(0)
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      setRatio(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0)
    }
    update()
    addEventListener('scroll', update, { passive: true })
    addEventListener('resize', update)
    return () => {
      removeEventListener('scroll', update)
      removeEventListener('resize', update)
    }
  }, [])
  return ratio
}

/**
 * 문서 안의 .reveal 요소를 한 번에 관찰한다.
 * 화면마다 래퍼 컴포넌트를 씌우면 DOM 이 한 겹씩 늘어나므로, 클래스만 붙이면 되도록
 * 최상위에서 한 개의 옵저버가 전부 맡는다. 라우트가 바뀌면 새로 그려진 요소를 다시 훑는다.
 */
export function useRevealAll(routeKey: string) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-revealed)'))
    if (nodes.length === 0) return
    if (reducedMotion() || typeof IntersectionObserver !== 'function') {
      nodes.forEach((node) => node.classList.add('is-revealed'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [routeKey])
}

/**
 * 라우트가 바뀔 때 읽는 위치를 정리한다.
 *
 * react-router 는 스크롤을 되돌려 주지 않아서, 목록 하단에서 상세로 들어가면 페이지
 * 중간부터 보였다. 해시가 있으면 그 자리로, 없으면 맨 위로 옮기고 본문에 포커스를 준다.
 * 포커스까지 옮겨야 키보드·스크린 리더 사용자도 새 화면의 처음부터 읽는다.
 */
export function useRouteReset(
  pathname: string,
  hash: string,
  container: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const focusContainer = () => container.current?.focus({ preventScroll: true })

    if (!hash) {
      scrollTo({ top: 0, left: 0, behavior: 'auto' })
      focusContainer()
      return
    }

    // 앵커 대상이 데이터 도착 후에 그려지는 화면이 있어 잠시 기다렸다 다시 찾는다.
    const targetId = decodeURIComponent(hash.slice(1))
    let attempts = 0
    const findTarget = () => {
      const target = document.getElementById(targetId)
      if (target) {
        target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
        focusContainer()
        return
      }
      if (++attempts > 12) {
        scrollTo({ top: 0, left: 0, behavior: 'auto' })
        focusContainer()
        return
      }
      timer = setTimeout(findTarget, 120)
    }
    let timer = setTimeout(findTarget, 0)
    return () => clearTimeout(timer)
  }, [container, hash, pathname])
}
