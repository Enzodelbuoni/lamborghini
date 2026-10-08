import { useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from './lib/gsap'
import { SEGMENTS } from './config/experience'
import { loadVideo } from './lib/loadVideo'
import Header from './components/Header/Header'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import HeroExperience from './components/HeroExperience/HeroExperience'
import TransitionSection from './components/TransitionSection/TransitionSection'
import Marquee from './components/Marquee/Marquee'
import SpecsSection from './components/SpecsSection/SpecsSection'
import EngineSection from './components/EngineSection/EngineSection'
import DesignSection from './components/DesignSection/DesignSection'
import PerformanceSection from './components/PerformanceSection/PerformanceSection'
import Footer from './components/Footer/Footer'
import Cursor from './components/Cursor/Cursor'

/**
 * phase: 'loading'  → loading screen, scroll locked
 *        'leaving'  → loading screen fades out, the car emerges
 *        'entered'  → experience is live
 */
export default function App() {
  const [sources, setSources] = useState([null, null])
  const [loadProgress, setLoadProgress] = useState(0)
  const [heroReady, setHeroReady] = useState(false)
  const [phase, setPhase] = useState('loading')

  // Clip 1 gates the experience; clip 2 is fetched right after it, in the background.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.documentElement.classList.add('is-loading')
    document.fonts?.ready.then(() => ScrollTrigger.refresh())

    const abort = new AbortController()
    const urls = []
    const keep = (index, url) => {
      urls.push(url)
      setSources((prev) => prev.map((s, i) => (i === index ? url : s)))
    }

    ;(async () => {
      keep(0, await loadVideo(SEGMENTS[0].src, { onProgress: setLoadProgress, signal: abort.signal }))
      keep(1, await loadVideo(SEGMENTS[1].src, { signal: abort.signal }))
    })().catch((error) => {
      if (error.name !== 'AbortError') console.error('[SVJ] video loading failed', error)
    })

    return () => {
      abort.abort()
      urls.forEach((url) => url.startsWith('blob:') && URL.revokeObjectURL(url))
    }
  }, [])

  const handleHeroReady = useCallback(() => setHeroReady(true), [])
  const handleLoaderLeave = useCallback(() => setPhase('leaving'), [])
  const handleLoaderExited = useCallback(() => {
    document.documentElement.classList.remove('is-loading')
    setPhase('entered')
    ScrollTrigger.refresh()
  }, [])

  return (
    <>
      {phase !== 'entered' && (
        <LoadingScreen
          progress={loadProgress}
          ready={heroReady}
          onLeave={handleLoaderLeave}
          onExited={handleLoaderExited}
        />
      )}

      <Header visible={phase !== 'loading'} />

      <main>
        <HeroExperience sources={sources} phase={phase} onReady={handleHeroReady} />
        <TransitionSection />
        <Marquee />
        <SpecsSection />
        <EngineSection />
        <DesignSection />
        <PerformanceSection />
      </main>

      <Footer />
      <Cursor />
    </>
  )
}
