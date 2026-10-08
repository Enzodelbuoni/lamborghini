import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { riseIn, drawLines, fadeUp, countUp } from '../../lib/reveal'
import './SpecsSection.css'

const SPECS = [
  {
    value: '770',
    unit: 'CV',
    title: 'Horsepower',
    text: 'Peak output at 8,500 rpm. Delivered without turbochargers, without delay.',
  },
  {
    value: '6.5',
    unit: 'L',
    title: 'Naturally aspirated V12',
    text: '6,498 cc, mid-mounted. Pure, immediate response at every rpm.',
  },
  {
    value: '2.8',
    unit: 's',
    title: '0–100 km/h',
    text: 'All-wheel drive and 720 Nm of torque, put down in one clean launch.',
  },
  {
    value: '351',
    unit: 'km/h',
    title: 'Top speed',
    text: 'Held in place by ALA 2.0 active aerodynamics.',
  },
]

export default function SpecsSection() {
  const ref = useRef(null)

  useGSAP(
    () => {
      riseIn('.specs__heading .mask > span', { triggerEl: '.specs__heading' })
      fadeUp('.specs__kicker', { triggerEl: '.specs__heading', delay: 0 })

      gsap.utils.toArray('.spec').forEach((row) => {
        drawLines(row.querySelector('.spec__rule'), { triggerEl: row, start: 'top 88%' })
        riseIn(row.querySelector('.spec__value'), { triggerEl: row, start: 'top 82%', delay: 0.1 })
        countUp(row.querySelector('.spec__number'), { triggerEl: row, start: 'top 82%', delay: 0.15, duration: 2 })
        fadeUp(row.querySelectorAll('.spec__meta > *'), { triggerEl: row, start: 'top 82%', delay: 0.3 })
      })
    },
    { scope: ref }
  )

  return (
    <section ref={ref} id="specs" className="specs" aria-labelledby="specs-title">
      <div className="section-shell">
        <header className="specs__heading">
          <p className="label label--muted specs__kicker">Technical data</p>
          <h2 id="specs-title" className="specs__title">
            <span className="mask">
              <span>Specifications</span>
            </span>
          </h2>
        </header>

        <ol className="specs__list">
          {SPECS.map((spec, i) => (
            <li key={spec.title} className="spec">
              <span className="spec__rule" aria-hidden="true" />
              <div className="spec__figure">
                <span className="mask">
                  <span className="spec__value">
                    <span className="numeral spec__number" data-count={spec.value}>
                      {spec.value}
                    </span>
                    <span className="spec__unit">{spec.unit}</span>
                  </span>
                </span>
              </div>
              <div className="spec__meta">
                <span className="label label--accent spec__index">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="label spec__title">{spec.title}</h3>
                <p className="spec__text">{spec.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
