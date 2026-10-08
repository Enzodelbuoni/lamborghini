import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { prefersReducedMotion } from '../../lib/reveal'
import './EditorialImage.css'

/**
 * Photograph with a curtain reveal, a slow settle and scroll parallax,
 * plus an optional museum-style caption.
 *
 * - `fill`: the frame fills its parent (grid cell) instead of keeping the photo's ratio
 * - `overlay`: the caption sits inside the photo, over a soft shade
 * - `delay`: offsets the reveal, to stagger photos that enter together
 */
export default function EditorialImage({
  src,
  alt,
  width,
  height,
  ratio,
  caption,
  className = '',
  position = '50% 50%',
  fill = false,
  overlay = false,
  delay = 0,
}) {
  const ref = useRef(null)

  useGSAP(
    () => {
      const frame = ref.current.querySelector('.ed-image__frame')
      const img = ref.current.querySelector('img')
      const reduced = prefersReducedMotion()
      const trigger = { trigger: frame, start: 'top 82%', toggleActions: 'play none none reverse' }

      const tl = gsap.timeline({ scrollTrigger: trigger })
      if (delay && !reduced) tl.to({}, { duration: delay }) // stagger offset, kept inside the timeline
      tl.from(frame, { clipPath: 'inset(100% 0% 0% 0%)', duration: reduced ? 0 : 1.6, ease: 'expo.inOut' })
        .from(img, { scale: reduced ? 1 : 1.18, duration: 2.2, ease: 'expo.out' }, '<0.25')
        .from(
          ref.current.querySelectorAll('.ed-image__caption > *'),
          { autoAlpha: 0, y: 12, duration: 0.9, stagger: 0.08, ease: 'power3.out' },
          '<0.5'
        )

      if (!reduced) {
        gsap.fromTo(
          img,
          { yPercent: -5 },
          { yPercent: 5, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } }
        )
      }
    },
    { scope: ref }
  )

  const captionEl = caption && (
    <figcaption className={`ed-image__caption${overlay ? ' ed-image__caption--overlay' : ''}`}>
      <span className="label label--accent">{caption.index}</span>
      <span className="label ed-image__title">{caption.title}</span>
      {caption.text && <span className="ed-image__text">{caption.text}</span>}
    </figcaption>
  )

  return (
    <figure ref={ref} className={`ed-image${fill ? ' ed-image--fill' : ''} ${className}`}>
      <div className="ed-image__frame" style={fill ? undefined : { aspectRatio: ratio ?? `${width} / ${height}` }}>
        <div className="ed-image__zoom">
          <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" style={{ objectPosition: position }} />
        </div>
        {overlay && captionEl}
      </div>
      {!overlay && captionEl}
    </figure>
  )
}
