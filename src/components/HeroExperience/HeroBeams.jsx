import { useEffect, useRef } from 'react'
import { HEADLIGHTS } from '../../content/headlights'

/** CSS conic angle (0° = up, clockwise) of the direction (dx, dy). */
const angleOf = (dx, dy) => ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360

/**
 * Light from the headlights spilling past the video, down to the bottom
 * corners of the hero — one cone per headlight, forming a wide V.
 *
 * Sits behind the clip: the footage keeps its own lit floor, the cones only
 * show outside it and through its dissolved edges. Each cone starts at the
 * headlight's real position (measured frame by frame, see headlights.js) and
 * follows the frame that is actually on screen, reported by the controller
 * through `apiRef.current.show(segment, frame)`.
 */
export default function HeroBeams({ apiRef }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const stage = root.parentElement
    const frameEl = stage.querySelector('.video-stage__frame')
    const [leftBeam, rightBeam] = root.children
    let layout = null
    let current = { segment: 0, frame: 0 }

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

    const render = () => {
      if (!layout) return
      const row = current.segment === 0 ? HEADLIGHTS[current.frame] : null
      const level = row ? row[4] : 0
      root.style.setProperty('--level', level.toFixed(3))
      root.style.visibility = level > 0.002 ? 'visible' : 'hidden'
      if (!row || level <= 0.002) return
      const { H, fx, fw } = layout
      aim(leftBeam, fx + row[0] * fw, row[1] * H, -1)
      aim(rightBeam, fx + row[2] * fw, row[3] * H, 1)
    }

    const measure = () => {
      const s = stage.getBoundingClientRect()
      const f = frameEl.getBoundingClientRect()
      layout = { W: s.width, H: s.height, fx: f.left - s.left, fw: f.width }
      render()
    }

    const resize = new ResizeObserver(measure)
    resize.observe(stage)
    measure()

    apiRef.current = {
      show(segment, frame) {
        if (frame < 0) return
        current = { segment, frame: Math.min(frame, HEADLIGHTS.length - 1) }
        render()
      },
    }

    return () => {
      resize.disconnect()
      apiRef.current = null
    }
  }, [apiRef])

  return (
    <div ref={rootRef} className="video-stage__beams" aria-hidden="true">
      <span className="video-stage__beam video-stage__beam--left" />
      <span className="video-stage__beam video-stage__beam--right" />
    </div>
  )
}
