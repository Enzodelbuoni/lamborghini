import { useRef } from 'react'
import { gsap, SplitText, useGSAP } from '../../lib/gsap'
import { riseIn, fadeUp, prefersReducedMotion } from '../../lib/reveal'
import EditorialImage from '../EditorialImage/EditorialImage'
import './DesignSection.css'

/* `position` frames the subject of each photo inside its grid cell */
const PHOTOS = {
  front: {
    src: '/images/svj-detail-front.webp',
    width: 650,
    height: 1220,
    position: '50% 60%',
    alt: 'Front three-quarter of a black Aventador in the dark, Y-shaped headlight lit',
    caption: { index: '01', title: 'Y-shaped signature', text: 'The face of the V12 flagship, drawn in light.' },
  },
  rear: {
    src: '/images/svj-detail-rear.webp',
    width: 1134,
    height: 960,
    position: '50% 88%',
    alt: 'Rear of the Aventador SVJ in black and white: carbon diffuser, honeycomb grille and twin exhausts',
    caption: { index: '02', title: 'Diffuser & exhausts', text: 'Carbon fibre sculpted around two high-mounted pipes.' },
  },
  wing: {
    src: '/images/svj-detail-wing.webp',
    width: 453,
    height: 633,
    position: '50% 45%',
    alt: 'Matte Aventador SVJ rear wing and side intake at night',
    caption: { index: '03', title: 'ALA 2.0 rear wing', text: 'Active aero, balanced corner by corner.' },
  },
}

/**
 * The one light chapter of the page — a printed-magazine spread. The paper
 * panel opens from a card to full bleed as it arrives and folds back as it leaves.
 * The photos sit in a strict grid: every edge lines up with another.
 */
export default function DesignSection() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const reduced = prefersReducedMotion()

      if (!reduced) {
        gsap.fromTo(
          '.design__panel',
          { clipPath: 'inset(16vh 7vw 0vh 7vw)' },
          {
            clipPath: 'inset(0vh 0vw 0vh 0vw)',
            ease: 'none',
            scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'top 12%', scrub: true },
          }
        )
        gsap.fromTo(
          '.design__panel',
          { clipPath: 'inset(0vh 0vw 0vh 0vw)' },
          {
            clipPath: 'inset(0vh 7vw 16vh 7vw)',
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: ref.current, start: 'bottom 88%', end: 'bottom top', scrub: true },
          }
        )
      }

      riseIn('.design__title .mask > span', { triggerEl: '.design__title', stagger: 0.1 })
      fadeUp(['.design__kicker', '.design__intro'], { triggerEl: '.design__title' })

      // the statement tile reveals like the photos, then its lines rise
      gsap.from('.design__note', {
        clipPath: 'inset(100% 0% 0% 0%)',
        duration: reduced ? 0 : 1.6,
        delay: reduced ? 0 : 0.3,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: '.design__note', start: 'top 85%', toggleActions: 'play none none reverse' },
      })
      SplitText.create('.design__note-text', {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: reduced ? 0 : 110,
            autoAlpha: reduced ? 0 : 1,
            duration: 1.2,
            stagger: 0.08,
            delay: reduced ? 0 : 0.9,
            ease: 'expo.out',
            scrollTrigger: { trigger: '.design__note', start: 'top 85%', toggleActions: 'play none none reverse' },
          }),
      })
      fadeUp('.design__note-head > *', { triggerEl: '.design__note', start: 'top 85%', delay: 1 })
    },
    { scope: ref }
  )

  return (
    <section ref={ref} id="design" className="design" aria-labelledby="design-title">
      <div className="design__panel">
        <div className="section-shell">
          <div className="design__top">
            <header className="design__head">
              <p className="label label--muted design__kicker">Design — Anatomy</p>
              <h2 id="design-title" className="design__title">
                <span className="mask">
                  <span>Shaped</span>
                </span>
                <span className="mask">
                  <span className="design__title-strong">by the air.</span>
                </span>
              </h2>
            </header>

            <p className="design__intro">
              Active aerodynamics, a carbon-fibre wing and a diffuser cut around two exhausts. Nothing on the SVJ is
              there for decoration.
            </p>
          </div>

          <div className="design__bento">
            <EditorialImage {...PHOTOS.front} className="design__tile design__front" fill overlay />
            <EditorialImage {...PHOTOS.rear} className="design__tile design__rear" fill overlay delay={0.12} />
            <EditorialImage {...PHOTOS.wing} className="design__tile design__wing" fill overlay />

            <blockquote className="design__tile design__note">
              <div className="design__note-head">
                <span className="label label--accent">ALA 2.0</span>
                <span className="numeral design__note-index">04</span>
              </div>
              <p className="design__note-text">
                Every vent, every fin, every surface exists for one reason: to keep 770 CV on the ground.
              </p>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  )
}
