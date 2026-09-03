import { useEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, CustomEase)

const autoScrollEase = CustomEase.create('landingAutoScroll', 'M0,0 C0.64,0 0.16,1 1,1')

export function scrollToExperience(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    target.scrollIntoView()
    return
  }

  gsap.killTweensOf(window)
  document.documentElement.classList.add('landing-auto-scroll')

  const showcasePins = ScrollTrigger.getAll().filter((trigger) =>
    trigger.vars.id?.startsWith('landing-showcase-pin-'),
  )
  showcasePins.forEach((trigger) => trigger.disable(true, false))
  ScrollTrigger.refresh()
  const targetY = window.scrollY + target.getBoundingClientRect().top
  const scrollDistance = Math.abs(targetY - window.scrollY)
  const scrollDuration = gsap.utils.clamp(0.62, 0.95, scrollDistance / 2800)

  let restored = false
  const restoreShowcasePins = (alignTarget: boolean) => {
    if (restored) return
    restored = true
    showcasePins.forEach((trigger) => trigger.enable(false, false))
    ScrollTrigger.refresh()
    if (alignTarget) {
      const restoredTargetY = window.scrollY + target.getBoundingClientRect().top
      window.scrollTo({ top: restoredTargetY, behavior: 'auto' })
    }
    ScrollTrigger.update()
    requestAnimationFrame(() => {
      if (alignTarget) {
        const exactTargetY = window.scrollY + target.getBoundingClientRect().top
        window.scrollTo({ top: exactTargetY, behavior: 'auto' })
        ScrollTrigger.update()
      }
      document.documentElement.classList.remove('landing-auto-scroll')
    })
  }

  gsap.to(window, {
    duration: scrollDuration,
    scrollTo: { y: targetY, autoKill: false },
    ease: autoScrollEase,
    onComplete: () => restoreShowcasePins(true),
    onInterrupt: () => restoreShowcasePins(false),
  })
}

export function useLandingMotion(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = scope.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const desktop = window.matchMedia('(min-width: 768px)').matches
    if (reduced) return

    const context = gsap.context(() => {
      const directionalReveal = (
        trigger: Element,
        items: HTMLElement[],
        distance = 64,
        duration = 0.9,
        stagger = 0.14,
      ) => {
        if (!items.length) return
        gsap.set(items, { autoAlpha: 0, y: distance })
        const animateIn = (fromTop: boolean) => {
          const orderedItems = fromTop ? [...items].reverse() : items
          gsap.killTweensOf(items)
          gsap.fromTo(
            orderedItems,
            { autoAlpha: 0, y: fromTop ? -distance : distance },
            {
              autoAlpha: 1,
              y: 0,
              duration,
              stagger,
              ease: 'power2.out',
              overwrite: 'auto',
            },
          )
        }
        const animateOut = (toBottom: boolean) => {
          const orderedItems = toBottom ? [...items].reverse() : items
          gsap.killTweensOf(items)
          gsap.to(orderedItems, {
            autoAlpha: 0,
            y: toBottom ? distance : -distance,
            duration: duration * 0.72,
            stagger: stagger * 0.7,
            ease: 'power2.in',
            overwrite: 'auto',
          })
        }
        ScrollTrigger.create({
          trigger,
          start: 'top 88%',
          end: 'bottom 12%',
          onEnter: () => animateIn(false),
          onLeave: () => animateOut(false),
          onEnterBack: () => animateIn(true),
          onLeaveBack: () => animateOut(true),
        })
      }

      const scrollSequence = (section: HTMLElement, items: HTMLElement[], distance: number) => {
        if (!items.length) return

        const clampProgress = gsap.utils.clamp(0, 1)
        const enterEase = gsap.parseEase('power2.out')
        const exitEase = gsap.parseEase('power2.in')
        const exitItemMotionSpan = 0.52
        let viewportHeight = window.innerHeight
        let sectionHeight = section.offsetHeight
        let totalScrollRange = sectionHeight + viewportHeight * 0.42
        let exitStartDistance = sectionHeight + viewportHeight * 0.16
        let itemOffsets: number[] = []

        const getOffsetWithinSection = (item: HTMLElement) => {
          let offset = 0
          let current: HTMLElement | null = item
          while (current && current !== section) {
            offset += current.offsetTop
            current = current.offsetParent as HTMLElement | null
          }
          return offset
        }

        const updateRanges = () => {
          viewportHeight = window.innerHeight
          sectionHeight = section.offsetHeight
          totalScrollRange = sectionHeight + viewportHeight * 0.42
          exitStartDistance = sectionHeight + viewportHeight * 0.16
          itemOffsets = items.map(getOffsetWithinSection)
        }

        const renderProgress = (progress: number) => {
          const scrollDistance = progress * totalScrollRange
          const exitPhase = clampProgress(
            (scrollDistance - exitStartDistance) / (viewportHeight * 0.26),
          )

          items.forEach((item, index) => {
            const orderProgress = items.length > 1 ? index / (items.length - 1) : 0
            const enterStartDistance = itemOffsets[index] + viewportHeight * 0.08
            const availableEnterDistance =
              exitStartDistance - viewportHeight * 0.04 - enterStartDistance
            const enterDistance = gsap.utils.clamp(
              viewportHeight * 0.18,
              viewportHeight * 0.32,
              availableEnterDistance,
            )
            const itemEnter = enterEase(
              clampProgress((scrollDistance - enterStartDistance) / enterDistance),
            )
            const exitItemStart = orderProgress * (1 - exitItemMotionSpan)
            const itemExit = exitEase(
              clampProgress((exitPhase - exitItemStart) / exitItemMotionSpan),
            )
            const autoAlpha = itemEnter * (1 - itemExit)
            const y =
              scrollDistance < exitStartDistance ? distance * (1 - itemEnter) : -distance * itemExit

            gsap.set(item, { autoAlpha, y })
          })
        }

        updateRanges()
        renderProgress(0)
        ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          end: 'bottom 58%',
          invalidateOnRefresh: true,
          onUpdate: (trigger) => renderProgress(trigger.progress),
          onRefresh: (trigger) => {
            updateRanges()
            renderProgress(trigger.progress)
          },
        })
      }

      gsap.from('[data-hero-content]', {
        autoAlpha: 0,
        y: 72,
        duration: 1.9,
        ease: 'power2.out',
      })

      const story = root.querySelector('[data-story]')
      if (story) {
        const copy = story.querySelector<HTMLElement>('[data-story-copy]')
        const image = story.querySelector<HTMLElement>('[data-story-image]')
        if (copy && image) {
          const travel = desktop ? 125 : 42
          gsap.set(copy, { xPercent: travel, autoAlpha: 0 })
          gsap.set(image, {
            xPercent: -travel,
            autoAlpha: 0,
            scale: desktop ? 1.08 : 1.03,
          })
          gsap
            .timeline({
              scrollTrigger: {
                trigger: story,
                start: 'top 92%',
                end: 'bottom 82%',
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            })
            .to(
              copy,
              {
                xPercent: 0,
                autoAlpha: 1,
                duration: 1,
                ease: 'power1.inOut',
              },
              0,
            )
            .to(
              image,
              {
                xPercent: 0,
                scale: 1,
                autoAlpha: 1,
                duration: 1,
                ease: 'power1.inOut',
              },
              0,
            )
        }
      }

      const values = root.querySelector('[data-values]')
      if (values) {
        directionalReveal(
          values,
          Array.from(values.querySelectorAll<HTMLElement>('[data-value-card]')),
          90,
          1,
          0.18,
        )
      }

      root.querySelectorAll<HTMLElement>('[data-showcase]').forEach((section) => {
        const slides = Array.from(section.querySelectorAll<HTMLElement>('[data-showcase-slide]'))
        if (!desktop || slides.length < 2) {
          directionalReveal(
            section,
            Array.from(
              section.querySelectorAll<HTMLElement>('[data-showcase-copy], [data-showcase-slide]'),
            ),
            48,
          )
          return
        }
        gsap.set(slides.slice(1), { xPercent: 120, scale: 1.22, autoAlpha: 0 })
        const timeline = gsap.timeline({
          scrollTrigger: {
            id: `landing-showcase-pin-${section.classList.contains('landing-showcase--rooms') ? 'rooms' : 'facility'}`,
            trigger: section,
            pin: true,
            start: 'top top',
            end: `+=${slides.length * 105}%`,
            scrub: 1.2,
            anticipatePin: 1,
          },
        })
        slides.slice(0, -1).forEach((slide, index) => {
          timeline
            .to(slide, {
              xPercent: -115,
              scale: 0.72,
              autoAlpha: 0,
              ease: 'power2.inOut',
              duration: 1,
            })
            .to(
              slides[index + 1],
              { xPercent: 0, scale: 1, autoAlpha: 1, ease: 'power2.inOut', duration: 1 },
              '<',
            )
        })
      })

      root.querySelectorAll<HTMLElement>('[data-sequence]').forEach((section) => {
        const distanceBySection: Record<string, number> = {
          'wellness-experience': 64,
          'quietness-experience': 72,
          'program-experience': 58,
        }
        scrollSequence(
          section,
          Array.from(section.querySelectorAll<HTMLElement>('[data-sequence-item]')),
          distanceBySection[section.id] ?? 64,
        )
      })

      const finalSection = root.querySelector('[data-final]')
      const finalContent = root.querySelector<HTMLElement>('[data-final-content]')
      if (finalSection && finalContent) {
        directionalReveal(finalSection, [finalContent], 150, 1.65, 0)
      }

      const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-section]'))
      sections.slice(0, -1).forEach((section, index) => {
        const nextSection = sections[index + 1]
        const isShowcase = section.matches('[data-showcase]')
        const transitionsIntoRooms =
          section.matches('.landing-story-values') &&
          nextSection.matches('.landing-showcase--rooms')
        const needsEdgeShadow = section.matches(
          '.landing-story-values, .landing-wellness, .landing-program',
        )
        const hasSequencedContent = section.matches('[data-sequence]')
        if ((nextSection.matches('[data-showcase]') && !transitionsIntoRooms) || isShowcase) return
        gsap.set(section, {
          transformOrigin: '50% 100%',
          transformPerspective: 1400,
        })
        gsap.to(section, {
          scale: 0.95,
          rotationX: 8,
          autoAlpha: 0.28,
          boxShadow: needsEdgeShadow ? '0 32px 90px rgb(14 34 57 / 0.34)' : 'none',
          ease: 'none',
          scrollTrigger: {
            trigger: transitionsIntoRooms ? section : nextSection,
            start: transitionsIntoRooms
              ? 'bottom 67%'
              : hasSequencedContent
                ? 'top 55%'
                : 'top 67%',
            end: transitionsIntoRooms ? 'bottom 40%' : 'top 40%',
            scrub: 0.45,
            invalidateOnRefresh: true,
          },
        })
      })
    }, root)
    return () => context.revert()
  }, [scope])
}
