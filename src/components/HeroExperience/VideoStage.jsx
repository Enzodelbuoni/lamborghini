import { SEGMENTS } from '../../config/experience'
import HeroLight from './HeroLight'

/**
 * Purely visual layer: the light outside the clip (beams + edge spill), the two
 * stacked clips in front of it and the framing vignette. All behaviour lives in
 * ExperienceController.
 */
export default function VideoStage({ sources, videoRef, lightRef }) {
  return (
    <div className="video-stage">
      <HeroLight apiRef={lightRef} />

      <div className="video-stage__frame">
        {SEGMENTS.map((segment, i) => (
          <video
            key={segment.id}
            ref={(el) => videoRef(i, el)}
            className="video-stage__video"
            src={sources[i] ?? undefined}
            poster={segment.poster}
            data-visible={i === 0 ? 'true' : 'false'}
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            preload="auto"
            tabIndex={-1}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="video-stage__vignette" aria-hidden="true" />
    </div>
  )
}
