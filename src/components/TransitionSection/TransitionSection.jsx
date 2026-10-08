import { useRef } from 'react'
import { useGSAP } from '../../lib/gsap'
import { riseIn, drawLines, fadeUp, countUp } from '../../lib/reveal'
import './TransitionSection.css'

const KEY_FIGURES = [
  { value: '6.5', unit: 'L', label: 'V12' },
  { value: '770', unit: 'CV', label: 'Power' },
  { value: '2.8', unit: 's', label: '0–100 km/h' },
  { value: '351', unit: 'km/h', label: 'Top speed' },
]

/**
 * Rises over the last frames of the hero while the car drives away:
 * its transparent-to-black top edge darkens the scene, then the numbers land.
 */
export default function TransitionSection() {
  const ref = useRef(null)

  useGSAP(
    () => {
      riseIn('.svj-intro__title .mask > span', { triggerEl: '.svj-intro__title', stagger: 0.1 })
      fadeUp(['.svj-intro__kicker', '.svj-intro__lede'], { triggerEl: '.svj-intro__title' })
      drawLines('.svj-intro__rule', { triggerEl: '.svj-intro__figures', start: 'top 90%', stagger: 0.1 })
      riseIn('.svj-intro__figure-value', { triggerEl: '.svj-intro__figures', start: 'top 90%', stagger: 0.1, delay: 0.2 })
      countUp('.svj-intro__figure-value .numeral', { triggerEl: '.svj-intro__figures', start: 'top 90%', delay: 0.25 })
      fadeUp('.svj-intro__figure-label', { triggerEl: '.svj-intro__figures', start: 'top 90%', stagger: 0.1, delay: 0.5 })
    },
    { scope: ref }
  )

  return (
    <section ref={ref} id="svj" className="svj-intro" aria-labelledby="svj-title">
      <div className="section-shell">
        <p className="label label--accent svj-intro__kicker">SVJ — Superveloce Jota</p>

        <h2 id="svj-title" className="svj-intro__title">
          <span className="mask">
            <span>Aventador</span>
          </span>
          <span className="mask">
            <span className="svj-intro__title-accent">SVJ</span>
          </span>
        </h2>

        <p className="svj-intro__lede">
          The most extreme expression of the naturally aspirated V12. Built for the lap record, homologated for the
          road.
        </p>

        <ul className="svj-intro__figures">
          {KEY_FIGURES.map((figure) => (
            <li key={figure.label} className="svj-intro__figure">
              <span className="svj-intro__rule" aria-hidden="true" />
              <span className="mask">
                <span className="svj-intro__figure-value">
                  <span className="numeral" data-count={figure.value}>
                    {figure.value}
                  </span>
                  <span className="svj-intro__figure-unit">{figure.unit}</span>
                </span>
              </span>
              <span className="label label--muted svj-intro__figure-label">{figure.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
