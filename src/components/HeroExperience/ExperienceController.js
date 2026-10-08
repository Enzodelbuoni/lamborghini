import { FPS } from '../../config/experience'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const frameToTime = (frame) => (frame + 0.5) / FPS // middle of the frame → exact frame on every browser

/**
 * Maps one global scroll progress (0 → 1) onto two videos as if they were a
 * single continuous shot.
 *
 *   progress < transitionPoint  → clip 1 drives the image
 *   progress ≥ transitionPoint  → clip 2 drives the image
 *
 * Videos are never played: each frame is reached by setting currentTime.
 * The inactive clip stays paused and parked on its boundary frame (both are
 * near-black underbody frames), so the swap is instant and invisible.
 * Only one seek per video is in flight at a time; the latest requested frame
 * wins when the previous seek completes.
 * `onFrame(video, segmentIndex, frame)` reports the frame that is actually on
 * screen, after its seek has completed — anything synced to the footage
 * (like the headlight beams) should follow it rather than the scroll.
 */
export class ExperienceController {
  constructor({ segments, transitionPoint, onSegmentChange, onFrame }) {
    this.transitionPoint = transitionPoint
    this.onSegmentChange = onSegmentChange
    this.onFrame = onFrame
    this.progress = 0
    this.active = 0
    this.visible = 0
    this.segments = segments.map((s) => ({
      startFrame: s.startFrame,
      endFrame: s.endFrame,
      video: null,
      ready: false,
      shownFrame: -1,
      seekingTo: -1,
      targetFrame: s.startFrame,
      onSeeked: null,
    }))
  }

  /** Connects a <video> element to a segment. Call markReady() once it can seek. */
  attach(index, video) {
    const seg = this.segments[index]
    if (seg.video === video) return
    this.detach(index)
    seg.video = video
    seg.onSeeked = () => this.handleSeeked(index)
    video.addEventListener('seeked', seg.onSeeked)
  }

  detach(index) {
    const seg = this.segments[index]
    if (seg.video && seg.onSeeked) seg.video.removeEventListener('seeked', seg.onSeeked)
    seg.video = null
    seg.ready = false
    seg.shownFrame = -1
    seg.seekingTo = -1
  }

  markReady(index) {
    const seg = this.segments[index]
    if (!seg.video) return
    seg.video.pause()
    seg.ready = true
    seg.shownFrame = -1
    seg.seekingTo = -1
    this.setProgress(this.progress)
  }

  isReady(index) {
    return this.segments[index].ready
  }

  setProgress(value) {
    const p = clamp01(value)
    this.progress = p

    const tp = this.transitionPoint
    const index = p < tp ? 0 : 1
    const local = index === 0 ? p / tp : (p - tp) / (1 - tp)
    const seg = this.segments[index]
    const frame = Math.round(seg.startFrame + local * (seg.endFrame - seg.startFrame))

    if (index !== this.active) {
      this.active = index
      this.onSegmentChange?.(index)
    }

    this.requestFrame(index, frame)

    // Park the idle clip on the frame that touches the cut.
    const idle = 1 - index
    const idleSeg = this.segments[idle]
    this.requestFrame(idle, idle === 0 ? idleSeg.endFrame : idleSeg.startFrame)

    this.updateVisibility()
  }

  requestFrame(index, frame) {
    const seg = this.segments[index]
    seg.targetFrame = frame
    if (!seg.ready) return
    if (seg.seekingTo !== -1) return // the pending seek will pick up targetFrame
    if (frame === seg.shownFrame) return
    seg.seekingTo = frame
    seg.video.currentTime = frameToTime(frame)
  }

  handleSeeked(index) {
    const seg = this.segments[index]
    if (seg.seekingTo === -1) return
    seg.shownFrame = seg.seekingTo
    seg.seekingTo = -1

    if (seg.targetFrame !== seg.shownFrame) {
      this.requestFrame(index, seg.targetFrame)
    }

    this.updateVisibility()
    if (index === this.visible) this.onFrame?.(seg.video, index, seg.shownFrame)
  }

  /**
   * Shows the active clip as soon as it has a decoded frame. Until then the
   * other clip keeps holding its (black) boundary frame — never an empty stage.
   */
  updateVisibility() {
    const wanted = this.active
    const candidate = this.segments[wanted]
    const next = candidate.ready && candidate.shownFrame !== -1 ? wanted : this.visible

    if (next === this.visible && this.segments[next].video?.dataset.visible === 'true') return
    this.visible = next
    this.segments.forEach((s, i) => {
      if (s.video) s.video.dataset.visible = i === next ? 'true' : 'false'
    })
    this.onFrame?.(this.segments[next].video, next, this.segments[next].shownFrame)
  }

  destroy() {
    this.segments.forEach((_, i) => this.detach(i))
  }
}
