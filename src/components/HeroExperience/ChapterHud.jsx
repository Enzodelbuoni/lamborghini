import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { CHAPTERS } from '../../config/experience'

const pad = (n) => String(n).padStart(2, '0')

/** Chapter readout (bottom left) and scroll progress hairline (bottom right). */
export default function ChapterHud({ chapter, progressRef }) {
  const labelRef = useRef(null)
  const isFirst = useRef(true)
  const current = CHAPTERS[chapter]

  useGSAP(
    () => {
      if (isFirst.current) {
        isFirst.current = false
        return
      }
      gsap.fromTo(
        labelRef.current.children,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, overwrite: true }
      )
    },
    { dependencies: [chapter] }
  )

  return (
    <div className="hero-hud" aria-live="polite">
      <div className="hero-hud__chapter">
        <span className="mask hero-hud__mask">
          <span ref={labelRef} className="hero-hud__line">
            <span className="numeral hero-hud__index">
              {current.index} <span className="hero-hud__total">/ {pad(CHAPTERS.length)}</span>
            </span>
            <span className="label hero-hud__name">{current.label}</span>
          </span>
        </span>
      </div>

      <div className="hero-hud__progress" aria-hidden="true">
        <span className="hero-hud__track">
          <span ref={progressRef} className="hero-hud__fill" />
        </span>
      </div>
    </div>
  )
}
