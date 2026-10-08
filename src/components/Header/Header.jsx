import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import './Header.css'

const LINKS = [
  { href: '#experience', index: '01', label: 'Experience' },
  { href: '#svj', index: '02', label: 'Aventador SVJ' },
  { href: '#specs', index: '03', label: 'Specifications' },
  { href: '#engine', index: '04', label: 'Engine' },
  { href: '#design', index: '05', label: 'Design' },
  { href: '#performance', index: '06', label: 'Performance' },
]

export default function Header({ visible }) {
  const headerRef = useRef(null)
  const menuRef = useRef(null)
  const menuTl = useRef(null)
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const [light, setLight] = useState(false)

  // entrance after the loading screen
  useGSAP(
    () => {
      if (visible) gsap.to(headerRef.current, { autoAlpha: 1, duration: 1.4, delay: 0.9, ease: 'power2.out' })
    },
    { dependencies: [visible] }
  )

  // a whisper of blur only once the header sits over editorial content,
  // and dark ink while it crosses the paper-coloured Design spread
  useGSAP(() => {
    ScrollTrigger.create({
      trigger: '#svj',
      start: 'top top',
      onToggle: (self) => setSolid(self.isActive),
      end: 'max',
    })
    ScrollTrigger.create({
      trigger: '#design',
      start: 'top 48px',
      end: 'bottom 48px',
      onToggle: (self) => setLight(self.isActive),
    })
  })

  // menu overlay timeline
  useGSAP(
    () => {
      menuTl.current = gsap
        .timeline({ paused: true })
        .set(menuRef.current, { autoAlpha: 1 })
        .fromTo(menuRef.current, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.inOut' })
        .fromTo(
          '.menu__item-text',
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07 },
          '-=0.35'
        )
        .fromTo('.menu__line', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'expo.out', stagger: 0.07 }, '<')
        .fromTo('.menu__foot', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, '-=0.6')
    },
    { scope: menuRef }
  )

  useEffect(() => {
    const tl = menuTl.current
    if (!tl) return
    if (open) tl.timeScale(1).play()
    else tl.timeScale(1.6).reverse()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (event, href) => {
    event.preventDefault()
    setOpen(false)
    gsap.to(window, { scrollTo: { y: href, autoKill: true }, duration: 1.8, ease: 'power3.inOut', delay: 0.35 })
  }

  return (
    <>
      <header ref={headerRef} className={`header${solid ? ' header--solid' : ''}${light && !open ? ' header--light' : ''}${open ? ' header--open' : ''}`}>
        <a href="#experience" className="header__mark" onClick={(e) => go(e, 0)} aria-label="SVJ — back to start">
          SVJ
        </a>
        <button
          type="button"
          className="header__menu label"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="header__menu-text">{open ? 'Close' : 'Menu'}</span>
          <span className="header__menu-icon" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </header>

      <nav ref={menuRef} id="site-menu" className="menu" aria-label="Main" aria-hidden={!open} inert={!open}>
        <ul className="menu__list">
          {LINKS.map((link) => (
            <li key={link.href} className="menu__item">
              <span className="menu__line" aria-hidden="true" />
              <a href={link.href} className="menu__link" onClick={(e) => go(e, link.href)}>
                <span className="mask">
                  <span className="menu__item-text">
                    <span className="numeral menu__index">{link.index}</span>
                    <span className="menu__label">{link.label}</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="menu__foot">
          <span className="label label--muted">6.5L V12 — 770 CV</span>
          <span className="label label--muted">Naturally aspirated</span>
        </div>
      </nav>
    </>
  )
}
