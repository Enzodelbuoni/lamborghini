import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { HERO_GALLERY, GALLERY_SWAP, GALLERY_EXIT } from '../../content/heroCopy'

const pad = (n) => String(n).padStart(2, '0')

/**
 * Detail plates beside the video (wide screens). Like HeroCopy, it builds a
 * paused timeline that HeroExperience scrubs with the video's own progress:
 * each plate wipes up over the previous one, drifts in a slow push-out,
 * and the counter rolls like an odometer.
 */
export default function HeroGallery({ timelineRef, revealed }) {
  const rootRef = useRef(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const slides = gsap.utils.toArray('.hero-gallery__slide', root)
      const captions = gsap.utils.toArray('.hero-gallery__caption', root)
      const fills = gsap.utils.toArray('.hero-gallery__fill', root)
      const roll = root.querySelector('.hero-gallery__roll')
      const tl = gsap.timeline({ paused: true })

      HERO_GALLERY.forEach((plate, i) => {
        const start = plate.from
        const end = HERO_GALLERY[i + 1]?.from ?? GALLERY_EXIT
        const img = slides[i].querySelector('img')

        tl.fromTo(img, { scale: 1.16 }, { scale: 1.02, duration: end - start, ease: 'none' }, start)
        tl.fromTo(fills[i], { scaleX: 0 }, { scaleX: 1, duration: end - start, ease: 'none' }, start)

        if (i === 0) return

        tl.fromTo(
          slides[i],
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: GALLERY_SWAP, ease: 'power3.inOut' },
          start
        )
        tl.fromTo(
          slides[i - 1].querySelector('.hero-gallery__shade'),
          { opacity: 0 },
          { opacity: 0.8, duration: GALLERY_SWAP, ease: 'power2.in' },
          start
        )
        tl.fromTo(
          slides[i - 1].querySelector('img'),
          { yPercent: 0 },
          { yPercent: -7, duration: GALLERY_SWAP, ease: 'power2.in', immediateRender: false },
          start
        )
        tl.fromTo(
          captions[i - 1].querySelectorAll('.hero-gallery__line'),
          { yPercent: 0 },
          { yPercent: -110, duration: GALLERY_SWAP * 0.6, ease: 'power2.in', immediateRender: false },
          start
        )
        tl.fromTo(
          captions[i].querySelectorAll('.hero-gallery__line'),
          { yPercent: 110 },
          { yPercent: 0, duration: GALLERY_SWAP * 0.7, ease: 'power3.out', stagger: GALLERY_SWAP * 0.12 },
          start + GALLERY_SWAP * 0.35
        )
        tl.to(roll, { yPercent: (-100 / HERO_GALLERY.length) * i, duration: GALLERY_SWAP, ease: 'power3.inOut' }, start)
      })

      // leaves together with the last copy beat, as the editorial section rises
      tl.fromTo(
        root.querySelector('.hero-gallery__inner'),
        { autoAlpha: 1, y: 0 },
        { autoAlpha: 0, y: -32, duration: 0.035, ease: 'power2.in', immediateRender: false },
        GALLERY_EXIT
      )
      tl.set({}, {}, 1) // timeline length = 1 → tl.progress(p) maps 1:1 to scroll progress
      timelineRef.current = tl

      // opening state, released by the intro below
      gsap.set(root, { autoAlpha: 0 })
      gsap.set(root.querySelector('.hero-gallery__frame'), { clipPath: 'inset(100% 0% 0% 0%)' })
      gsap.set(captions[0].querySelectorAll('.hero-gallery__line'), { yPercent: 110 })
    },
    { scope: rootRef }
  )

  useGSAP(
    () => {
      if (!revealed) return
      const root = rootRef.current
      gsap
        .timeline({ delay: 2.1 })
        .set(root, { autoAlpha: 1 })
        .to(root.querySelector('.hero-gallery__frame'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
        .from(root.querySelectorAll('.hero-gallery__head, .hero-gallery__bars'), { autoAlpha: 0, duration: 0.9, stagger: 0.1 }, '-=0.9')
        .to(
          root.querySelectorAll('.hero-gallery__caption:first-child .hero-gallery__line'),
          { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' },
          '-=0.7'
        )
    },
    { dependencies: [revealed], scope: rootRef }
  )

  return (
    <aside ref={rootRef} className="hero-gallery" aria-label="Details">
      <div className="hero-gallery__inner">
        <div className="hero-gallery__head">
          <span className="label label--muted">Details</span>
          <span className="numeral hero-gallery__count">
            <span className="hero-gallery__window">
              <span className="hero-gallery__roll">
                {HERO_GALLERY.map((plate, i) => (
                  <span key={plate.id}>{pad(i + 1)}</span>
                ))}
              </span>
            </span>
            <span className="hero-gallery__total">/ {pad(HERO_GALLERY.length)}</span>
          </span>
        </div>

        <div className="hero-gallery__frame">
          {HERO_GALLERY.map((plate) => (
            <figure key={plate.id} className="hero-gallery__slide">
              <img src={plate.src} alt={plate.alt} width="900" height="1200" decoding="async" />
              <span className="hero-gallery__shade" aria-hidden="true" />
            </figure>
          ))}
        </div>

        <div className="hero-gallery__bars" aria-hidden="true">
          {HERO_GALLERY.map((plate) => (
            <span key={plate.id} className="hero-gallery__bar">
              <span className="hero-gallery__fill" />
            </span>
          ))}
        </div>

        <div className="hero-gallery__captions">
          {HERO_GALLERY.map((plate) => (
            <div key={plate.id} className="hero-gallery__caption">
              <span className="mask">
                <span className="label hero-gallery__line hero-gallery__title">{plate.title}</span>
              </span>
              <span className="mask">
                <span className="hero-gallery__line hero-gallery__text">{plate.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
