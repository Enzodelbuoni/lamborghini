import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { riseIn, fadeUp } from '../../lib/reveal'
import EditorialImage from '../EditorialImage/EditorialImage'
import './PerformanceSection.css'

const STATEMENTS = ['Built for performance.', 'Engineered without compromise.', 'Naturally aspirated.', 'V12 power.']

export default function PerformanceSection() {
  const ref = useRef(null)

  useGSAP(
    () => {
      fadeUp('.performance__kicker', { triggerEl: '.performance__statements', start: 'top 85%', delay: 0 })

      gsap.utils.toArray('.performance__statement').forEach((line) => {
        riseIn(line.querySelector('.performance__text'), { triggerEl: line, start: 'top 90%' })
        // each line "lights up" as it reaches the centre of the screen
        gsap.fromTo(
          line.querySelector('.performance__text'),
          { color: 'rgba(242, 242, 242, 0.16)' },
          {
            color: 'rgba(242, 242, 242, 1)',
            ease: 'none',
            scrollTrigger: { trigger: line, start: 'top 72%', end: 'top 42%', scrub: true },
          }
        )
      })

    },
    { scope: ref }
  )

  return (
    <section ref={ref} id="performance" className="performance" aria-labelledby="performance-title">
      <div className="section-shell performance__grid">
        <div className="performance__copy">
          <p id="performance-title" className="label label--muted performance__kicker">
            Engineering — Performance
          </p>
          <ul className="performance__statements">
            {STATEMENTS.map((text, i) => (
              <li key={text} className="performance__statement">
                <span className="numeral performance__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="mask">
                  <span className="performance__text">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <EditorialImage
          className="performance__media"
          src="/images/svj-overhead.webp"
          width={720}
          height={1280}
          ratio="3 / 4"
          position="50% 55%"
          alt="The SVJ seen from above at night, engine cover and rear wing lit by the road"
          caption={{ index: '04', title: 'V12 — mid-mounted', text: 'Seen from above: the engine sits right behind you.' }}
        />
      </div>
    </section>
  )
}
