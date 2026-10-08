import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { SEGMENTS, TRANSITION_POINT, CHAPTERS, SCRUB_SMOOTHING } from '../../config/experience'
import { whenVideoReady, primeVideo } from '../../lib/loadVideo'
import { ExperienceController } from './ExperienceController'
import VideoStage from './VideoStage'
import HeroCopy from './HeroCopy'
import HeroGallery from './HeroGallery'
import ScrollIndicator from './ScrollIndicator'
import ChapterHud from './ChapterHud'
import './HeroExperience.css'

const chapterAt = (progress) =>
  CHAPTERS.reduce((found, chapter, i) => (progress >= chapter.from ? i : found), 0)

export default function HeroExperience({ sources, phase, onReady }) {
  const sectionRef = useRef(null)
  const mediaRef = useRef(null)
  const progressRef = useRef(null)
  const copyTimelineRef = useRef(null)
  const galleryTimelineRef = useRef(null)
  const videosRef = useRef([])
  const lightRef = useRef(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  const [chapter, setChapter] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const chapterRef = useRef(0)
  const atStartRef = useRef(true)

  const controllerRef = useRef(null)
  if (!controllerRef.current) {
    controllerRef.current = new ExperienceController({
      segments: SEGMENTS,
      transitionPoint: TRANSITION_POINT,
      // the light outside the clip follows the frame that is really on screen
      onFrame: (video, segment, frame) => lightRef.current?.show(segment, frame, video),
    })
  }

  const registerVideo = useCallback((index, el) => {
    if (el) videosRef.current[index] = el
  }, [])

  // Connect each clip as soon as its source is available.
  useEffect(() => {
    const controller = controllerRef.current
    let cancelled = false

    SEGMENTS.forEach((_, i) => {
      const video = videosRef.current[i]
      if (!video || !sources[i] || controller.isReady(i)) return
      controller.attach(i, video)
      whenVideoReady(video)
        .then(() => primeVideo(video))
        .then(() => {
          if (cancelled) return
          controller.markReady(i)
          if (i === 0) onReadyRef.current?.()
        })
        .catch((error) => console.error(`[SVJ] clip ${i + 1} failed`, error))
    })

    return () => {
      cancelled = true
    }
  }, [sources])

  useEffect(() => () => controllerRef.current.destroy(), [])

  // scroll progress → video frame + copy beats + detail plates + HUD, all from one value
  useGSAP(
    () => {
      const controller = controllerRef.current
      const proxy = { progress: 0 }

      gsap.to(proxy, {
        progress: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: SCRUB_SMOOTHING,
        },
        onUpdate: () => {
          const p = proxy.progress
          controller.setProgress(p)
          copyTimelineRef.current?.progress(p)
          galleryTimelineRef.current?.progress(p)
          if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`

          const c = chapterAt(p)
          if (c !== chapterRef.current) {
            chapterRef.current = c
            setChapter(c)
          }
          const start = p < 0.004
          if (start !== atStartRef.current) {
            atStartRef.current = start
            setAtStart(start)
          }
        },
      })
    },
    { scope: sectionRef }
  )

  // Loading screen leaves → the car emerges from the dark.
  const revealed = phase !== 'loading'
  useGSAP(
    () => {
      if (!revealed) return
      gsap.to(mediaRef.current, { autoAlpha: 1, duration: 2.8, delay: 0.25, ease: 'power2.inOut' })
      gsap.to('.hero-hud', { autoAlpha: 1, duration: 1.4, delay: 2, ease: 'power2.out' })
    },
    { dependencies: [revealed], scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="experience" className="hero" aria-label="Aventador SVJ — the approach">
      <div className="hero__stage">
        <div ref={mediaRef} className="hero__media">
          <VideoStage sources={sources} videoRef={registerVideo} lightRef={lightRef} />
          <div className="hero__shade" aria-hidden="true" />
        </div>

        <HeroCopy timelineRef={copyTimelineRef} revealed={revealed} />
        <HeroGallery timelineRef={galleryTimelineRef} revealed={revealed} />

        <div className="hero__frame-ui">
          <ScrollIndicator visible={revealed && atStart} introDelay={2.6} />
        </div>

        <ChapterHud chapter={chapter} progressRef={progressRef} />
      </div>
    </section>
  )
}
