import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './reveal'

let lenis = null
const tick = (time) => lenis?.raf(time * 1000)
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Lenis turns the wheel's steps into one continuous scroll, so everything
 * ScrollTrigger drives — the video above all — moves fluidly instead of in
 * bursts. It runs on GSAP's ticker (one clock for scroll and animation) and
 * keeps native scrolling on touch screens. Created stopped: the loading
 * screen releases it.
 */
export function createSmoothScroll() {
  if (lenis || prefersReducedMotion()) return lenis
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  lenis.stop()
  return lenis
}

export function destroySmoothScroll() {
  if (!lenis) return
  gsap.ticker.remove(tick)
  gsap.ticker.lagSmoothing(500, 33)
  lenis.destroy()
  lenis = null
}

/** Freezes the page (loading screen, open menu) or releases it. */
export function lockScroll(locked) {
  if (locked) lenis?.stop()
  else lenis?.start()
}

/** Glides to a selector, element or pixel offset. */
export function scrollToTarget(target, duration = 1.8) {
  if (lenis) {
    // realign Lenis with where the page really is (a scrollbar drag may have
    // moved it behind Lenis' back), then glide from there
    lenis.scrollTo(window.scrollY, { immediate: true, force: true })
    lenis.scrollTo(target, { duration, easing: easeInOutCubic, force: true })
    return
  }
  gsap.to(window, { scrollTo: { y: target, autoKill: true }, duration, ease: 'power3.inOut' })
}
