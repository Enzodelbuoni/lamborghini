import { SEGMENTS } from '../../config/experience'

/**
 * Purely visual layer: the two stacked clips and the framing vignette.
 * All behaviour lives in ExperienceController.
 */
export default function VideoStage({ sources, videoRef }) {
  return (
    <div className="video-stage">
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
