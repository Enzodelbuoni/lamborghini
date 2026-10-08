import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'

/** "Scroll to experience" cue. Fades out on the first scroll, returns at the top. */
export default function ScrollIndicator({ visible, introDelay = 2 }) {
  const ref = useRef(null)
  const shownOnce = useRef(false)

  useGSAP(
    () => {
      if (visible) {
        gsap.to(ref.current, {
          autoAlpha: 1,
          y: 0,
          duration: 1.2,
          delay: shownOnce.current ? 0.15 : introDelay,
          ease: 'power2.out',
          overwrite: true,
        })
        shownOnce.current = true
      } else {
        gsap.to(ref.current, { autoAlpha: 0, y: 8, duration: 0.5, ease: 'power2.in', overwrite: true })
      }
    },
    { dependencies: [visible] }
  )

  return (
    <div ref={ref} className="scroll-indicator">
      <span className="label label--muted">Scroll to experience</span>
      <span className="scroll-indicator__track" aria-hidden="true">
        <span className="scroll-indicator__runner" />
      </span>
    </div>
  )
}
