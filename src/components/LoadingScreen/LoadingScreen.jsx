import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import './LoadingScreen.css'

const MIN_VISIBLE = 1.4 // seconds — avoids a flash when the video is cached

/**
 * Shown until the first clip can be scrubbed. `ready` starts the exit;
 * `onExited` fires once the screen is fully gone.
 */
export default function LoadingScreen({ progress, ready, onLeave, onExited }) {
  const rootRef = useRef(null)
  const barRef = useRef(null)
  const mountedAt = useRef(performance.now())

  useGSAP(
    () => {
      gsap.from('.loading__inner > *', { autoAlpha: 0, y: 10, duration: 1.1, stagger: 0.12, ease: 'power3.out' })
    },
    { scope: rootRef }
  )

  useGSAP(
    () => {
      gsap.to(barRef.current, { scaleX: progress, duration: 0.5, ease: 'power2.out', overwrite: true })
    },
    { dependencies: [progress] }
  )

  useGSAP(
    () => {
      if (!ready) return
      const elapsed = (performance.now() - mountedAt.current) / 1000
      const wait = Math.max(0, MIN_VISIBLE - elapsed)

      gsap
        .timeline({ delay: wait, onComplete: onExited })
        .to(barRef.current, { scaleX: 1, duration: 0.45, ease: 'power2.out', overwrite: true })
        .add(() => onLeave?.())
        .to('.loading__inner', { autoAlpha: 0, y: -6, duration: 0.8, ease: 'power2.in' })
        .to(rootRef.current, { autoAlpha: 0, duration: 1.1, ease: 'power2.inOut' }, '-=0.35')
    },
    { dependencies: [ready], scope: rootRef }
  )

  return (
    <div ref={rootRef} className="loading" role="status" aria-live="polite">
      <div className="loading__inner">
        <p className="loading__mark">SVJ</p>
        <p className="label label--muted">Loading experience</p>
        <span className="loading__track" aria-hidden="true">
          <span ref={barRef} className="loading__bar" />
        </span>
        <span className="visually-hidden">{Math.round(progress * 100)}%</span>
      </div>
    </div>
  )
}
