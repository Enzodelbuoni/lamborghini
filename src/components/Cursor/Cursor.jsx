import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import './Cursor.css'

const INTERACTIVE = 'a, button, [role="button"], [data-cursor]'

/**
 * Precision cursor for mouse/trackpad users: a dot that tracks the pointer
 * and a ring that trails it, opening up over anything clickable.
 * `mix-blend-mode: difference` keeps it visible on dark and light chapters.
 */
export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const root = document.documentElement
    const dot = dotRef.current
    const ring = ringRef.current
    root.classList.add('has-cursor')

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 })
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' })

    let shown = false
    const onMove = (e) => {
      if (!shown) {
        shown = true
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY })
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3, overwrite: 'auto' })
      }
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
    }
    const onOver = (e) => ring.classList.toggle('is-active', Boolean(e.target.closest?.(INTERACTIVE)))
    const onLeave = () => {
      shown = false
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3, overwrite: 'auto' })
    }
    const onDown = () => ring.classList.add('is-pressed')
    const onUp = () => ring.classList.remove('is-pressed')

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver)
    root.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      root.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      gsap.killTweensOf([dot, ring])
      root.classList.remove('has-cursor')
    }
  }, [])

  return (
    <>
      <span ref={ringRef} className="cursor cursor__ring" aria-hidden="true">
        <span className="cursor__ring-shape" />
      </span>
      <span ref={dotRef} className="cursor cursor__dot" aria-hidden="true" />
    </>
  )
}
