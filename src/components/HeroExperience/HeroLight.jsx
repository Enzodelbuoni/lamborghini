import { useEffect, useRef } from 'react'
import { HEADLIGHTS, EDGE_LIGHT } from '../../content/headlights'

const LAST_FRAME = HEADLIGHTS.length - 1
const ROWS = EDGE_LIGHT.rows
const EDGE = Uint8Array.from(atob(EDGE_LIGHT.data), (c) => c.charCodeAt(0))

const FEATHER = 0.2 // share of the clip width that dissolves at each side (see HeroExperience.css)
const CRUSH = 0.3 // extra contrast on the clip while the headlights are still off
const IGNITION_END = 60 // frames after this never get the opening darkness
const BEAM_ALPHA = 0.46 // beam opacity at light level 1
const TINT = [222, 230, 245] // cool white of the LEDs
const MAX_BACKING = 960 // the light is soft: drawn small, scaled up by the GPU

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const lerp = (a, b, t) => a + (b - a) * t
/** CSS conic angle (0° = up, clockwise) of the direction (dx, dy). */
const angleOf = (dx, dy) => ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360
const rgba = (a, k = 1) => `rgba(${TINT.map((c) => Math.round(c * k)).join(',')},${a})`

/** Headlight row for a fractional frame, interpolated between its two neighbours. */
function headlightsAt(frame) {
  const f0 = clamp(Math.floor(frame), 0, LAST_FRAME)
  const f1 = Math.min(LAST_FRAME, f0 + 1)
  const t = clamp(frame - f0, 0, 1)
  return HEADLIGHTS[f0].map((v, i) => lerp(v, HEADLIGHTS[f1][i], t))
}

/** Floor light (0–1) at the clip's border, for a fractional frame. side 0 = left, 1 = right. */
function edgeAt(frame, side, row) {
  const f0 = clamp(Math.floor(frame), 0, LAST_FRAME)
  const f1 = Math.min(LAST_FRAME, f0 + 1)
  const t = clamp(frame - f0, 0, 1)
  return lerp(EDGE[(f0 * 2 + side) * ROWS + row], EDGE[(f1 * 2 + side) * ROWS + row], t) / 255
}

/**
 * All the light that lives outside the clip, drawn on one small canvas
 * behind it (the GPU scales it up — soft light loses nothing):
 *
 * - beams: one cone per headlight, from its measured position down to the
 *   bottom corners (a wide V);
 * - spill: the clip's own lit floor, continued past its borders and faded, so
 *   the light never stops at a "wall". Precomputed per frame (floor only —
 *   no headlight glare, bodywork or ceiling lamps), no video reads at runtime;
 * - opening darkness: while the headlights are still off the clip gets a touch
 *   more contrast, sinking the source's blocky near-blacks into pure black.
 *
 * Driven by `apiRef.current.update(segment, frame)` with a fractional frame,
 * so the light glides between video frames. A static grain layer on top
 * dithers the gradients.
 */
export default function HeroLight({ apiRef }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const stage = root.parentElement
    const frameEl = stage.querySelector('.video-stage__frame')
    const ctx = canvas.getContext('2d')
    const layer = document.createElement('canvas') // scratch space for one beam / one spill
    const lctx = layer.getContext('2d')
    const canConic = typeof lctx.createConicGradient === 'function'

    let layout = null
    let shown = true // false on phones, where the clip covers the whole stage
    let current = { segment: 0, frame: 0 }

    // side: -1 = left headlight → bottom-left corner, 1 = right → bottom-right
    const drawBeam = (side, x, y) => {
      const { w, h } = layout
      const down = angleOf(0, h - y) // inner edge: straight down, hidden behind the clip
      const wide = angleOf((side < 0 ? -0.25 : 1.25) * w - x, h - y) // outer edge passes beyond the corner
      const from = side < 0 ? down : wide
      const k = Math.abs(wide - down) / 360
      const reach = Math.hypot((side < 0 ? 0 : w) - x, h - y)

      lctx.globalCompositeOperation = 'source-over'
      lctx.clearRect(0, 0, w, h)
      const cone = lctx.createConicGradient(((from - 90) * Math.PI) / 180, x, y)
      const stops =
        side < 0
          ? [[0, 0], [0.25, 1], [0.6, 0.7], [0.88, 0.35], [1, 0]]
          : [[0, 0], [0.12, 0.35], [0.4, 0.7], [0.75, 1], [1, 0]]
      stops.forEach(([at, a]) => cone.addColorStop(at * k, rgba(a)))
      cone.addColorStop(1, rgba(0))
      lctx.fillStyle = cone
      lctx.fillRect(0, 0, w, h)

      const falloff = lctx.createRadialGradient(x, y, 0, x, y, reach * 1.35)
      falloff.addColorStop(0, 'rgba(0,0,0,1)')
      falloff.addColorStop(0.45 / 1.35, 'rgba(0,0,0,0.75)')
      falloff.addColorStop(1 / 1.35, 'rgba(0,0,0,0.42)')
      falloff.addColorStop(1, 'rgba(0,0,0,0)')
      lctx.globalCompositeOperation = 'destination-in'
      lctx.fillStyle = falloff
      lctx.fillRect(0, 0, w, h)
    }

    // the spill hugs the clip: fully lit under its dissolving edge, then fades out
    const drawSpill = (side, frame) => {
      const { w, h, fx, fw, s } = layout
      const overlap = fw * FEATHER
      const inner = side === 0 ? fx + overlap : fx + fw - overlap // x where the clip is fully opaque
      const reach = side === 0 ? clamp(fx * 0.55, 0, 700 * s) : clamp((w - fx - fw) * 0.55, 0, 700 * s)
      const outer = side === 0 ? fx - reach : fx + fw + reach

      lctx.globalCompositeOperation = 'source-over'
      lctx.clearRect(0, 0, w, h)
      const column = lctx.createLinearGradient(0, 0, 0, h)
      for (let r = 0; r < ROWS; r++) column.addColorStop((r + 0.5) / ROWS, rgba(1, edgeAt(frame, side, r)))
      lctx.fillStyle = column
      lctx.fillRect(Math.min(inner, outer), 0, Math.abs(outer - inner), h)

      const fade = lctx.createLinearGradient(inner, 0, outer, 0)
      const span = Math.abs(outer - inner)
      const at = (px) => clamp(px / span, 0, 1)
      fade.addColorStop(0, 'rgba(0,0,0,1)')
      fade.addColorStop(at(overlap), 'rgba(0,0,0,1)')
      fade.addColorStop(at(overlap + reach * 0.18), 'rgba(0,0,0,0.78)')
      fade.addColorStop(at(overlap + reach * 0.42), 'rgba(0,0,0,0.46)')
      fade.addColorStop(at(overlap + reach * 0.7), 'rgba(0,0,0,0.17)')
      fade.addColorStop(1, 'rgba(0,0,0,0)')
      lctx.globalCompositeOperation = 'destination-in'
      lctx.fillStyle = fade
      lctx.fillRect(0, 0, w, h)
    }

    const render = () => {
      if (!layout) return
      const { segment, frame } = current
      const row = segment === 0 ? headlightsAt(frame) : null
      const level = row ? row[4] : 0

      // opening darkness fades out as the headlights come on. Only at the opening:
      // the light also drops to 0 when the car passes the camera, and the clip must
      // stay untouched there so the cut into clip 2 keeps matching brightness.
      const crush = row && frame < IGNITION_END ? clamp(1 - level * 1.7, 0, 1) : 0
      frameEl.style.filter = crush > 0.005 ? `contrast(${(1 + CRUSH * crush).toFixed(3)})` : ''

      const lit = shown && row && level > 0.002
      root.style.visibility = lit ? 'visible' : 'hidden'
      if (!lit) return

      const { w, h, fx, fw } = layout
      ctx.clearRect(0, 0, w, h)

      if (canConic) {
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = Math.min(1, level * BEAM_ALPHA)
        drawBeam(-1, fx + row[0] * fw, row[1] * h)
        ctx.drawImage(layer, 0, 0)
        drawBeam(1, fx + row[2] * fw, row[3] * h)
        ctx.drawImage(layer, 0, 0)
      }

      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = Math.min(1, level * 4)
      drawSpill(0, frame)
      ctx.drawImage(layer, 0, 0)
      drawSpill(1, frame)
      ctx.drawImage(layer, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    }

    const measure = () => {
      const st = stage.getBoundingClientRect()
      const f = frameEl.getBoundingClientRect()
      shown = getComputedStyle(root).display !== 'none'
      const s = Math.min(0.5, MAX_BACKING / Math.max(1, st.width)) // backing pixels per CSS pixel
      const w = Math.max(1, Math.round(st.width * s))
      const h = Math.max(1, Math.round(st.height * s))
      canvas.width = layer.width = w
      canvas.height = layer.height = h
      layout = { s, w, h, fx: (f.left - st.left) * s, fw: f.width * s }
      render()
    }

    const resize = new ResizeObserver(measure)
    resize.observe(stage)
    measure()

    apiRef.current = {
      update(segment, frame) {
        if (segment === current.segment && Math.abs(frame - current.frame) < 0.01) return
        current = { segment, frame: clamp(frame, 0, LAST_FRAME) }
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
      <canvas ref={canvasRef} className="video-stage__light-canvas" />
      <span className="video-stage__light-grain" />
    </div>
  )
}
