/**
 * Downloads a video completely and returns an object URL for it.
 *
 * Keeping the whole file in memory makes every seek instant (no range
 * requests while scrubbing) and gives a real progress value for the
 * loading screen. Falls back to the plain URL if streaming isn't possible.
 */
export async function loadVideo(src, { onProgress, signal } = {}) {
  try {
    const response = await fetch(src, { signal })
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${src}`)

    const total = Number(response.headers.get('content-length')) || 0
    if (!response.body || !total) {
      const blob = await response.blob()
      onProgress?.(1)
      return URL.createObjectURL(blob)
    }

    const reader = response.body.getReader()
    const chunks = []
    let received = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.length
      onProgress?.(Math.min(received / total, 1))
    }
    return URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }))
  } catch (error) {
    if (error.name === 'AbortError') throw error
    console.warn('[SVJ] streaming load failed, using direct URL', error)
    onProgress?.(1)
    return src
  }
}

/** Resolves once the element has decoded enough data to show and seek frames. */
export function whenVideoReady(video) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 2) return resolve(video)
    const done = () => {
      video.removeEventListener('loadeddata', done)
      video.removeEventListener('error', fail)
      resolve(video)
    }
    const fail = () => {
      video.removeEventListener('loadeddata', done)
      video.removeEventListener('error', fail)
      reject(video.error ?? new Error('Video failed to load'))
    }
    video.addEventListener('loadeddata', done)
    video.addEventListener('error', fail)
  })
}

/**
 * iOS Safari only paints a muted inline video after it has been played once.
 * A play/pause cycle primes the decoder; the animation itself never uses play().
 */
export async function primeVideo(video) {
  try {
    await video.play()
  } catch {
    /* autoplay refused — seeking still works on desktop browsers */
  }
  video.pause()
}
