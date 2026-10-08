import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { riseIn, drawLines, fadeUp } from '../../lib/reveal'
import './Footer.css'

export default function Footer() {
  const ref = useRef(null)

  useGSAP(
    () => {
      gsap.from('.footer__backdrop', {
        autoAlpha: 0,
        duration: 2.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none reverse' },
      })
      riseIn('.footer__mark .mask > span', { triggerEl: '.footer__mark', start: 'top 95%' })
      drawLines('.footer__rule', { triggerEl: '.footer__bar', start: 'top 98%' })
      fadeUp('.footer__bar > *:not(.footer__rule)', { triggerEl: '.footer__bar', start: 'top 98%', delay: 0.3 })
    },
    { scope: ref }
  )

  const toTop = (event) => {
    event.preventDefault()
    gsap.to(window, { scrollTo: { y: 0, autoKill: true }, duration: 2.4, ease: 'power3.inOut' })
  }

  return (
    <footer ref={ref} className="footer">
      <div className="footer__backdrop" aria-hidden="true">
        <img src="/images/svj-rear.webp" alt="" loading="lazy" decoding="async" width="720" height="1280" />
      </div>

      <div className="section-shell footer__inner">
        <p className="footer__mark" aria-label="SVJ">
          <span className="mask">
            <span>SVJ</span>
          </span>
        </p>

        <div className="footer__bar">
          <span className="footer__rule" aria-hidden="true" />
          <span className="label label--muted">Aventador SVJ — Cinematic experience</span>
          <a href="#experience" className="label footer__top" onClick={toTop}>
            Replay the approach <span aria-hidden="true">↑</span>
          </a>
          <span className="label label--muted footer__note">Concept project. Not affiliated with Automobili Lamborghini S.p.A.</span>
        </div>
      </div>
    </footer>
  )
}
