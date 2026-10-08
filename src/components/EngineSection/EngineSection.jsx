import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { riseIn, fadeUp, prefersReducedMotion } from '../../lib/reveal'
import './EngineSection.css'

/* ---------- tachometer geometry (600 × 600 viewBox, 0° = up, clockwise) ---------- */

const MAX_RPM = 9000
const REDLINE = 8500
const START_ANGLE = -135
const SWEEP = 270
const C = 300
const R = 250

const angleFor = (rpm) => START_ANGLE + (SWEEP * rpm) / MAX_RPM
const point = (angle, radius) => {
  const rad = (angle * Math.PI) / 180
  return [C + radius * Math.sin(rad), C - radius * Math.cos(rad)]
}
const arcPath = (fromRpm, toRpm, radius) => {
  const [x1, y1] = point(angleFor(fromRpm), radius)
  const [x2, y2] = point(angleFor(toRpm), radius)
  const large = angleFor(toRpm) - angleFor(fromRpm) > 180 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}
const tick = (rpm, outer, inner) => {
  const [x1, y1] = point(angleFor(rpm), outer)
  const [x2, y2] = point(angleFor(rpm), inner)
  return { x1, y1, x2, y2 }
}

const MAJORS = Array.from({ length: MAX_RPM / 1000 + 1 }, (_, i) => i * 1000)
const MINORS = Array.from({ length: MAX_RPM / 250 + 1 }, (_, i) => i * 250).filter((rpm) => rpm % 1000 !== 0)

const MILESTONES = [
  { rpm: 6750, value: '720', unit: 'Nm', label: 'Peak torque', at: '6,750 rpm' },
  { rpm: 8500, value: '770', unit: 'CV', label: 'Peak power', at: '8,500 rpm' },
]

const displayRpm = (rpm) => Math.round(rpm / 10) * 10 // what a digital tach would show

/**
 * "The heart": a pinned tachometer. Scrolling revs the V12 from idle to
 * peak power; torque and power light up as the needle sweeps past them.
 */
export default function EngineSection() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const root = ref.current
      const needle = root.querySelector('.engine__needle')
      const progressArc = root.querySelector('.engine__progress')
      const readout = root.querySelector('.engine__rpm')
      const milestones = gsap.utils.toArray('.engine__milestone', root)

      gsap.set(needle, { svgOrigin: `${C} ${C}`, rotation: START_ANGLE })
      const setNeedle = gsap.quickSetter(needle, 'rotation', 'deg')

      let lastRpm = -1
      const render = (rpm) => {
        if (Math.abs(rpm - lastRpm) < 1) return
        lastRpm = rpm
        // thresholds compare against the displayed value, so "8,500" on the dial always means peak power
        const shown = displayRpm(rpm)
        setNeedle(angleFor(rpm))
        progressArc.style.strokeDashoffset = String(1 - rpm / MAX_RPM)
        readout.textContent = shown.toLocaleString('en-US')
        milestones.forEach((el) => el.classList.toggle('is-on', shown >= Number(el.dataset.rpm)))
        root.classList.toggle('is-redline', shown >= REDLINE)
      }
      render(0)

      // 0 → 82 % of the pinned scroll revs to peak power, the rest holds it there
      const engine = { rpm: 0 }
      gsap
        .timeline({
          scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
          onUpdate: () => render(engine.rpm),
        })
        .to(engine, { rpm: REDLINE, duration: 0.82, ease: 'power1.inOut' })
        .to({}, { duration: 0.18 })

      // the dial draws itself as the section arrives
      if (!prefersReducedMotion()) {
        gsap
          .timeline({ scrollTrigger: { trigger: root, start: 'top 65%', toggleActions: 'play none none reverse' } })
          .from('.engine__track', { strokeDashoffset: 1, duration: 1.6, ease: 'expo.inOut' })
          .from('.engine__ticks line, .engine__nums text', { opacity: 0, duration: 0.6, stagger: 0.012 }, '-=1.1')
          .from('.engine__needle, .engine__hub', { opacity: 0, duration: 0.6 }, '-=0.4')
      }
      riseIn('.engine__title .mask > span', { triggerEl: '.engine__title', start: 'top 80%', stagger: 0.1 })
      // the list container fades in; each milestone's own opacity belongs to the .is-on state
      fadeUp(['.engine__kicker', '.engine__body', '.engine__milestones'], { triggerEl: '.engine__title', start: 'top 80%' })
    },
    { scope: ref }
  )

  return (
    <section ref={ref} id="engine" className="engine" aria-labelledby="engine-title">
      <div className="engine__stage">
        <div className="section-shell engine__grid">
          <div className="engine__intro">
            <p className="label label--muted engine__kicker">Engine — L539</p>
            <h2 id="engine-title" className="engine__title">
              <span className="mask">
                <span>The heart</span>
              </span>
              <span className="mask">
                <span className="engine__title-strong">of the bull.</span>
              </span>
            </h2>
            <p className="engine__body">
              6,498 cc, naturally aspirated, mounted right behind the cabin. Keep scrolling — and rev it.
            </p>
          </div>

          <div className="engine__gauge">
            <svg className="engine__dial" viewBox="0 0 600 600" role="img" aria-label="Tachometer revving to 8,500 rpm">
              <path className="engine__track" d={arcPath(0, MAX_RPM, R)} pathLength="1" />
              <path className="engine__redline" d={arcPath(REDLINE, MAX_RPM, R - 12)} />
              <path className="engine__progress" d={arcPath(0, MAX_RPM, R)} pathLength="1" />

              <g className="engine__ticks">
                {MINORS.map((rpm) => (
                  <line key={rpm} className="engine__tick" {...tick(rpm, R - 22, R - 32)} />
                ))}
                {MAJORS.map((rpm) => (
                  <line key={rpm} className="engine__tick engine__tick--major" {...tick(rpm, R - 22, R - 46)} />
                ))}
              </g>

              <g className="engine__nums">
                {MAJORS.map((rpm) => {
                  const [x, y] = point(angleFor(rpm), R - 80)
                  return (
                    <text key={rpm} x={x} y={y} className={rpm >= REDLINE ? 'engine__num engine__num--red' : 'engine__num'}>
                      {rpm / 1000}
                    </text>
                  )
                })}
              </g>

              <g className="engine__needle">
                <line x1={C} y1={C + 26} x2={C} y2={C - (R - 30)} />
              </g>
              <circle className="engine__hub" cx={C} cy={C} r="9" />
            </svg>

            <div className="engine__readout">
              <span className="numeral engine__rpm">0</span>
              <span className="label label--muted">rpm</span>
            </div>
          </div>

          <ul className="engine__milestones">
            {MILESTONES.map((m) => (
              <li key={m.label} className="engine__milestone" data-rpm={m.rpm}>
                <span className="engine__milestone-rule" aria-hidden="true" />
                <span className="engine__milestone-value">
                  <span className="numeral">{m.value}</span>
                  <span className="engine__milestone-unit">{m.unit}</span>
                </span>
                <span className="label engine__milestone-label">{m.label}</span>
                <span className="engine__milestone-at">{m.at}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
