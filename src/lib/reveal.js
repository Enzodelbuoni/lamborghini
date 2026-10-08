import { gsap } from './gsap'

/**
 * Shared scroll-entrance animations for the editorial sections.
 * Call inside useGSAP() so everything is reverted on unmount.
 */

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const trigger = (el, start) => ({ trigger: el, start, toggleActions: 'play none none reverse' })

/** Text that rises from behind a .mask wrapper. */
export function riseIn(targets, { triggerEl, start = 'top 85%', stagger = 0.08, delay = 0 } = {}) {
  if (prefersReducedMotion()) {
    return gsap.from(targets, { autoAlpha: 0, duration: 0.6, stagger, delay, scrollTrigger: trigger(triggerEl, start) })
  }
  return gsap.from(targets, {
    yPercent: 110,
    duration: 1.3,
    ease: 'expo.out',
    stagger,
    delay,
    scrollTrigger: trigger(triggerEl, start),
  })
}

/** Hairlines that draw themselves from the left. */
export function drawLines(targets, { triggerEl, start = 'top 85%', stagger = 0.08, delay = 0 } = {}) {
  return gsap.from(targets, {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: prefersReducedMotion() ? 0 : 1.6,
    ease: 'expo.inOut',
    stagger,
    delay,
    scrollTrigger: trigger(triggerEl, start),
  })
}

/**
 * Numbers that count up to their `data-count` value ("770", "2.8", "8,500"):
 * decimals and thousands separators are preserved. The final value is read
 * from the attribute, never from the (animated) text, and the text node React
 * rendered is updated in place.
 */
export function countUp(targets, { triggerEl, start = 'top 85%', duration = 1.8, delay = 0 } = {}) {
  if (prefersReducedMotion()) return null
  return gsap.utils.toArray(targets).map((el) => {
    const finalText = el.dataset.count
    const node = el.firstChild
    if (!finalText || !node || node.nodeType !== Node.TEXT_NODE) return null

    const value = parseFloat(finalText.replace(/,/g, ''))
    const decimals = (finalText.split('.')[1] || '').length
    const grouped = finalText.includes(',')
    const format = (v) =>
      grouped
        ? v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : v.toFixed(decimals)
    const write = (text) => {
      if (node.nodeValue !== text) node.nodeValue = text
    }
    // Whenever the count is not actually running, the real value is on screen.
    const settle = () => write(finalText)
    settle() // a previous (reverted) run may have left a partial value behind

    const state = { v: 0 }
    return gsap.to(state, {
      v: value,
      duration,
      delay,
      ease: 'power3.out',
      // GSAP may render a tween while reverting or killing it (StrictMode, hot reload,
      // unmount): only a count that is genuinely playing may show a partial value.
      onUpdate() {
        if (this.isActive()) write(format(state.v))
        else settle()
      },
      onComplete: settle,
      onReverseComplete: settle,
      onInterrupt: settle,
      scrollTrigger: { trigger: triggerEl ?? el, start, toggleActions: 'play none none reverse' },
    })
  })
}

/** Small copy fading up into place. */
export function fadeUp(targets, { triggerEl, start = 'top 85%', stagger = 0.08, delay = 0.15 } = {}) {
  return gsap.from(targets, {
    autoAlpha: 0,
    y: prefersReducedMotion() ? 0 : 16,
    duration: 1.1,
    ease: 'power3.out',
    stagger,
    delay,
    scrollTrigger: trigger(triggerEl, start),
  })
}
