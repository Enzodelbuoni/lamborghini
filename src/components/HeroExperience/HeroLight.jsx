import { useEffect, useRef } from 'react'
import { HEADLIGHTS } from '../../content/headlights'

/** CSS conic angle (0° = up, clockwise) of the direction (dx, dy). */
const angleOf = (dx, dy) => ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

const SOURCE_W = 720 // clip pixels
const SOURCE_H = 1280
const EDGE_STRIP = 36 // clip columns sampled at each side (5 %)
const ROWS = 64 // vertical resolution of the edge light
const FEATHER = 0.2 // share of the clip width that dissolves at each side (see HeroExperience.css)
const CRUSH = 0.3 // extra contrast on the clip while the headlights are still off
const IGNITION_END = 60 // frames after this never get the opening darkness
const GRAIN = 'url("/images/grain-dark.png")'

const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Edge colours → a smooth vertical light profile. Only light survives (blacks
 * stay black) and only the floor carries it: rows above the headlights'
 * horizon fade out, so ceiling lamps or the car body never smear sideways.
 */
function profile(data, column, horizon) {
  const rows = []
  for (let i = 0; i < ROWS; i++) {
    const o = (i * 2 + column) * 4
    rows.push([data[o], data[o + 1], data[o + 2]].map((v) => Math.max(0, v - 16) * (255 / 239)))
  }
  // [1 2 3 2 1] blur along the height, so floor texture doesn't turn into stripes
  const weights = [1, 2, 3, 2, 1]
  const stops = rows.map((_, i) => {
    const rgb = [0, 0, 0]
    let total = 0
    weights.forEach((w, k) => {
      const row = rows[i + k - 2]
      if (!row) return
      rgb[0] += row[0] * w
      rgb[1] += row[1] * w
      rgb[2] += row[2] * w
      total += w
    })
    const v = (i + 0.5) / ROWS
    const floor = smoothstep(horizon - 0.03, horizon + 0.1, v)
    const [r, g, b] = rgb.map((c) => Math.round((c / total) * floor))
    return `rgb(${r} ${g} ${b}) ${(v * 100).toFixed(2)}%`
  })
  return `linear-gradient(180deg, ${stops.join(', ')})`
}

/**
 * All the light that lives outside the clip, synced to the frame on screen:
 *
 * - spill: the colours at the clip's left / right edge, continued outwards and
 *   faded — the lit floor keeps going past the clip instead of stopping at a wall;
 * - beams: one cone per headlight, from its measured position down to the
 *   bottom corners (a wide V);
 * - opening darkness: while the headlights are still off, the clip gets a touch
 *   more contrast, sinking the source's blocky near-blacks into pure black.
 *
 * Driven by `apiRef.current.show(segment, frame, video)` from the controller.
 */
export default function HeroLight({ apiRef }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const stage = root.parentElement
    const frameEl = stage.querySelector('.video-stage__frame')
    const beams = root.querySelector('.video-stage__beams')
    const [leftBeam, rightBeam] = beams.children
    const leftSpill = root.querySelector('.video-stage__spill--left')
    const rightSpill = root.querySelector('.video-stage__spill--right')

    const sampler = document.createElement('canvas')
    sampler.width = 2
    sampler.height = ROWS
    const ctx = sampler.getContext('2d', { willReadFrequently: true })

    let layout = null
    let lightShown = true // false on phones, where the clip covers the whole stage
    let current = { segment: 0, frame: 0, video: null }

    // side: -1 = left headlight → bottom-left corner, 1 = right → bottom-right
    const aim = (beam, x, y, side) => {
      const { W, H } = layout
      const down = angleOf(0, H - y) // inner edge: straight down, hidden behind the clip
      const wide = angleOf((side < 0 ? -0.25 : 1.25) * W - x, H - y) // outer edge passes beyond the corner
      const corner = side < 0 ? 0 : W
      beam.style.setProperty('--x', x.toFixed(1))
      beam.style.setProperty('--y', y.toFixed(1))
      beam.style.setProperty('--from', (side < 0 ? down : wide).toFixed(2))
      beam.style.setProperty('--span', Math.abs(wide - down).toFixed(2))
      beam.style.setProperty('--reach', Math.hypot(corner - x, H - y).toFixed(1))
    }

    const paintSpill = (video, opacity, horizon) => {
      leftSpill.style.opacity = String(opacity)
      rightSpill.style.opacity = String(opacity)
      if (opacity <= 0 || !video || video.readyState < 2) return
      ctx.drawImage(video, 0, 0, EDGE_STRIP, SOURCE_H, 0, 0, 1, ROWS)
      ctx.drawImage(video, SOURCE_W - EDGE_STRIP, 0, EDGE_STRIP, SOURCE_H, 1, 0, 1, ROWS)
      const { data } = ctx.getImageData(0, 0, 2, ROWS)
      leftSpill.style.backgroundImage = `${GRAIN}, ${profile(data, 0, horizon)}`
      rightSpill.style.backgroundImage = `${GRAIN}, ${profile(data, 1, horizon)}`
    }

    const render = () => {
      if (!layout) return
      const row = current.segment === 0 ? HEADLIGHTS[current.frame] : null
      const level = row ? row[4] : 0

      // opening darkness fades out as the headlights come on. Only at the opening:
      // the light also drops to 0 when the car passes the camera, and the clip must
      // stay untouched there so the cut into clip 2 keeps matching brightness.
      const crush = row && current.frame < IGNITION_END ? clamp(1 - level * 1.7, 0, 1) : 0
      frameEl.style.filter = crush > 0.005 ? `contrast(${(1 + CRUSH * crush).toFixed(3)})` : ''

      root.style.visibility = level > 0.002 ? 'visible' : 'hidden'
      beams.style.setProperty('--level', level.toFixed(3))
      if (!row || level <= 0.002 || !lightShown) return

      const { H, fx, fw } = layout
      aim(leftBeam, fx + row[0] * fw, row[1] * H, -1)
      aim(rightBeam, fx + row[2] * fw, row[3] * H, 1)
      paintSpill(current.video, Math.min(1, level * 4), (row[1] + row[3]) / 2)
    }

    // the spill hugs the clip: fully opaque under its dissolving edge, then fades out
    const placeSpill = (el, left, width, overlap, towards) => {
      el.style.left = `${left.toFixed(1)}px`
      el.style.width = `${width.toFixed(1)}px`
      const reach = width - overlap
      const at = (k) => `${(overlap + reach * k).toFixed(1)}px`
      const mask = `linear-gradient(${towards}, #000 0px, #000 ${overlap.toFixed(1)}px, rgba(0,0,0,0.78) ${at(0.18)}, rgba(0,0,0,0.46) ${at(0.42)}, rgba(0,0,0,0.17) ${at(0.7)}, rgba(0,0,0,0) ${width.toFixed(1)}px)`
      el.style.webkitMaskImage = mask
      el.style.maskImage = mask
    }

    const measure = () => {
      const s = stage.getBoundingClientRect()
      const f = frameEl.getBoundingClientRect()
      layout = { W: s.width, H: s.height, fx: f.left - s.left, fw: f.width }
      lightShown = getComputedStyle(root).display !== 'none'
      const overlap = f.width * FEATHER
      const leftReach = clamp(layout.fx * 0.55, 0, 700)
      const rightReach = clamp((layout.W - layout.fx - f.width) * 0.55, 0, 700)
      placeSpill(leftSpill, layout.fx - leftReach, leftReach + overlap, overlap, 'to left')
      placeSpill(rightSpill, layout.fx + f.width - overlap, rightReach + overlap, overlap, 'to right')
      render()
    }

    const resize = new ResizeObserver(measure)
    resize.observe(stage)
    measure()

    apiRef.current = {
      show(segment, frame, video) {
        if (frame < 0) return
        current = { segment, frame: Math.min(frame, HEADLIGHTS.length - 1), video }
        render()
      },
    }

    return () => {
      resize.disconnect()
      frameEl.style.filter = ''
      apiRef.current = null
    }
  }, [apiRef])

  return (
    <div ref={rootRef} className="video-stage__light" aria-hidden="true">
      <div className="video-stage__beams">
        <span className="video-stage__beam video-stage__beam--left" />
        <span className="video-stage__beam video-stage__beam--right" />
      </div>
      <span className="video-stage__spill video-stage__spill--left" />
      <span className="video-stage__spill video-stage__spill--right" />
    </div>
  )
}
