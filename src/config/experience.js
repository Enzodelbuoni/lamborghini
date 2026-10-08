/**
 * Central configuration for the cinematic scroll experience.
 *
 * Frame numbers refer to the source videos (24 fps, 192 frames each).
 * The cut between the two clips happens on frames where the camera is under
 * the car and both images are almost black (avg. luma 19 in both clips),
 * so the switch is hidden by the body of the car itself.
 */
export const FPS = 24

export const SEGMENTS = [
  {
    id: 'approach',
    src: '/videos/svj-approach.mp4',
    poster: '/images/svj-poster.webp',
    startFrame: 0,
    endFrame: 165, // underbody, nearly black — last frame shown from clip 1
  },
  {
    id: 'overhead',
    src: '/videos/svj-overhead.mp4',
    startFrame: 33, // underbody, nearly black — first frame shown from clip 2
    endFrame: 191,
  },
]

const frameCount = (s) => s.endFrame - s.startFrame + 1
const TOTAL_FRAMES = SEGMENTS.reduce((sum, s) => sum + frameCount(s), 0)

/**
 * Scroll progress where clip 1 hands over to clip 2.
 * Proportional to the frame count so both clips advance at the same speed
 * (≈ 0.51). Override with a fixed number to tune the feel.
 */
export const TRANSITION_POINT = frameCount(SEGMENTS[0]) / TOTAL_FRAMES

/** Narrative chapters, expressed in global scroll progress (0 → 1). */
export const CHAPTERS = [
  { index: '01', label: 'Ignition', from: 0 },
  { index: '02', label: 'The Approach', from: 48 / TOTAL_FRAMES },
  { index: '03', label: 'Camera Rise', from: TRANSITION_POINT },
]

export const SCRUB_SMOOTHING = 0.45 // seconds for the playhead to catch up with the scroll
