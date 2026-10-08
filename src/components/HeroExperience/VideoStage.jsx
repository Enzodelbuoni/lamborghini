import { SEGMENTS } from '../../config/experience'
import HeroBeams from './HeroBeams'

/**
 * Purely visual layer: the headlight beams, the two stacked clips (in front
 * of the beams) and the framing vignette. All behaviour lives in
 * ExperienceController.
 */
export default function VideoStage({ sources, videoRef, beamsRef }) {
  return (
    <div className="video-stage">
      <HeroBeams apiRef={beamsRef} />

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
