import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { HERO_BEATS, BEAT_ENTER, BEAT_EXIT } from '../../content/heroCopy'

const lineText = (line) => (typeof line === 'string' ? line : line.text)
const isStrong = (line) => typeof line !== 'string' && line.strong

/**
 * Editorial copy beside the video. Builds a paused timeline whose progress is
 * driven by the same scroll progress as the video (see HeroExperience), so
 * every line lands on the matching moment of the footage, in both directions.
 */
export default function HeroCopy({ timelineRef, revealed }) {
  const rootRef = useRef(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ paused: true })

      HERO_BEATS.forEach((beat) => {
        const el = rootRef.current.querySelector(`[data-beat="${beat.id}"]`)
        const lines = el.querySelectorAll('.hero-copy__line')
        const soft = el.querySelectorAll('.hero-copy__kicker, .hero-copy__body')

        if (beat.in != null) {
          tl.fromTo(
            lines,
            { yPercent: 115 },
            { yPercent: 0, duration: BEAT_ENTER, stagger: BEAT_ENTER * 0.22, ease: 'power3.out' },
            beat.in
          )
          tl.fromTo(
            soft,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: BEAT_ENTER, ease: 'power2.out' },
            beat.in + BEAT_ENTER * 0.35
          )
        }
        tl.fromTo(el, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -32, duration: BEAT_EXIT, ease: 'power2.in', immediateRender: false }, beat.out)
      })

      tl.set({}, {}, 1) // timeline length = 1 → tl.progress(p) maps 1:1 to scroll progress
      timelineRef.current = tl

      // the opening beat waits for the loading screen
      const first = rootRef.current.querySelector(`[data-beat="${HERO_BEATS[0].id}"]`)
      gsap.set(first.querySelectorAll('.hero-copy__line'), { yPercent: 115 })
      gsap.set(first.querySelectorAll('.hero-copy__kicker, .hero-copy__body'), { autoAlpha: 0, y: 14 })
    },
    { scope: rootRef }
  )

  useGSAP(
    () => {
      if (!revealed) return
      const first = rootRef.current.querySelector(`[data-beat="${HERO_BEATS[0].id}"]`)
      gsap.to(first.querySelectorAll('.hero-copy__line'), {
        yPercent: 0,
        duration: 1.6,
        stagger: 0.12,
        ease: 'expo.out',
        delay: 1.5,
      })
      gsap.to(first.querySelectorAll('.hero-copy__kicker, .hero-copy__body'), {
        autoAlpha: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power2.out',
        delay: 1.8,
      })
    },
    { dependencies: [revealed], scope: rootRef }
  )

  return (
    <div ref={rootRef} className="hero-copy">
      {HERO_BEATS.map((beat) => (
        <div key={beat.id} className="hero-copy__beat" data-beat={beat.id}>
          <p className="label label--accent hero-copy__kicker">{beat.kicker}</p>

          {beat.figure && (
            <p className="hero-copy__figure">
              <span className="mask">
                <span className="hero-copy__line">
                  <span className="numeral">{beat.figure.value}</span>
                  <span className="hero-copy__figure-unit">{beat.figure.unit}</span>
                </span>
              </span>
            </p>
          )}

          <h2 className="hero-copy__title">
            {beat.lines.map((line) => (
              <span key={lineText(line)} className="mask">
                <span className={`hero-copy__line${isStrong(line) ? ' hero-copy__line--strong' : ''}`}>
                  {lineText(line)}
                </span>
              </span>
            ))}
          </h2>

          {beat.body && <p className="hero-copy__body">{beat.body}</p>}
        </div>
      ))}
    </div>
  )
}
