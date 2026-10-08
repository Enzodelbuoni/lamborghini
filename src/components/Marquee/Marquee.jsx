import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { prefersReducedMotion } from '../../lib/reveal'
import './Marquee.css'

const ROW_A = ['Superveloce Jota', '770 CV', 'Naturally aspirated', '6.5 V12']
const ROW_B = ['351 km/h', 'ALA 2.0', '0–100 in 2.8s', 'Nordschleife 6:44.97']

/** One row of words, repeated so it always overflows the screen. Every other word is outlined. */
function Row({ words, className }) {
  const items = [...words, ...words, ...words]
  return (
    <div className={`marquee__row ${className}`}>
      {items.map((word, i) => (
        <span key={i} className="marquee__item">
          <span className={i % 2 ? 'marquee__word marquee__word--outline' : 'marquee__word'}>{word}</span>
          <span className="marquee__sep" aria-hidden="true" />
        </span>
      ))}
    </div>
  )
}

/**
 * Oversized type band between sections. The two rows slide in opposite
 * directions, tied to the scroll — the page keeps moving even between stories.
 */
export default function Marquee() {
  const ref = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const scrollTrigger = { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      gsap.fromTo('.marquee__row--a', { xPercent: 0 }, { xPercent: -22, ease: 'none', scrollTrigger })
      gsap.fromTo('.marquee__row--b', { xPercent: -22 }, { xPercent: 0, ease: 'none', scrollTrigger })
    },
    { scope: ref }
  )

  return (
    <section ref={ref} className="marquee" aria-label="Aventador SVJ in numbers">
      <p className="visually-hidden">
        Superveloce Jota, 770 CV, naturally aspirated 6.5 litre V12, 351 km/h, ALA 2.0, 0–100 km/h in 2.8 seconds,
        Nordschleife lap in 6:44.97.
      </p>
      <div aria-hidden="true">
        <Row words={ROW_A} className="marquee__row--a" />
        <Row words={ROW_B} className="marquee__row--b" />
      </div>
    </section>
  )
}
