/**
 * Everything that tells the story beside the video.
 *
 * All positions are global scroll progress values (0 → 1, the same scale
 * that drives the video), aligned with what the footage shows:
 *   0.00–0.15 headlights ignite · 0.15–0.46 the car advances
 *   0.46–0.51 it passes the camera (cut) · 0.52–0.62 rear view
 *   0.62–0.81 camera rises · 0.81–1.00 overhead, driving away
 */

/**
 * Copy beats (left column). `in` / `out` mark where the entrance / exit starts.
 * The first beat has no `in`: it is on screen when the experience opens.
 * A line written as { text, strong: true } is set in the heavy weight.
 */
export const HERO_BEATS = [
  {
    id: 'dark',
    kicker: 'Aventador SVJ',
    lines: ['Born in', { text: 'the dark.', strong: true }],
    body: 'A naturally aspirated V12, waiting for a single command.',
    out: 0.07,
  },
  {
    id: 'power',
    kicker: '6.5L — V12',
    lines: ['770 horses.', { text: 'Zero turbos.', strong: true }],
    body: 'Peak power at 8,500 rpm, delivered without a single turbocharger.',
    in: 0.14,
    out: 0.28,
  },
  {
    id: 'launch',
    kicker: '0–100 km/h',
    figure: { value: '2.8', unit: 's' },
    lines: ["It doesn't", 'arrive.', { text: 'It strikes.', strong: true }],
    in: 0.34,
    out: 0.46,
  },
  {
    id: 'ring',
    kicker: 'Superveloce Jota',
    lines: ['Built for', { text: 'the Ring.', strong: true }],
    body: '6:44.97 around the Nürburgring Nordschleife — a production-car lap record in 2018.',
    in: 0.56,
    out: 0.7,
  },
  {
    id: 'gone',
    kicker: '351 km/h',
    lines: ['Then,', { text: "it's gone.", strong: true }],
    in: 0.76,
    out: 0.86,
  },
]

export const BEAT_ENTER = 0.045 // share of the scroll each entrance takes
export const BEAT_EXIT = 0.035

/**
 * Detail plates (right column on wide screens). Each plate owns the scroll
 * window [from, next plate's from); the last one ends with GALLERY_EXIT.
 */
export const HERO_GALLERY = [
  {
    id: 'emblem',
    src: '/images/hero-emblem.webp',
    alt: 'Lamborghini shield emblem with the raging bull, covered in rain drops',
    title: 'The bull',
    text: "Sant'Agata Bolognese, since 1963.",
    from: 0,
  },
  {
    id: 'gauge',
    src: '/images/hero-gauge.webp',
    alt: 'Speedometer in the dark with a red needle',
    title: 'Velocity',
    text: '0–100 km/h in 2.8 seconds.',
    from: 0.31,
  },
  {
    id: 'taillight',
    src: '/images/hero-taillight.webp',
    alt: 'Rear spoiler and red tail light on wet bodywork at night',
    title: 'Departure',
    text: 'Red light, wet asphalt — gone.',
    from: 0.53,
  },
]

export const GALLERY_SWAP = 0.05 // share of the scroll each plate change takes
export const GALLERY_EXIT = 0.86
