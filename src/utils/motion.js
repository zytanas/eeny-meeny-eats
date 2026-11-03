// Motion helpers shared by JS-driven effects (GSAP, confetti, smooth scroll).
// CSS animations are handled globally in style.css.

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// Reads a design token from :root, e.g. cssVar('--orange')
export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// Small confetti burst in the palette colors. No-op for reduced motion.
// canvas-confetti is loaded on demand so it stays out of the main bundle.
export async function celebrate() {
  if (prefersReducedMotion()) return
  const { default: confetti } = await import('canvas-confetti')
  const colors = ['--orange', '--accent', '--cream', '--ink'].map(cssVar)
  const shared = { particleCount: 60, spread: 70, startVelocity: 45, colors, zIndex: 2000, disableForReducedMotion: true }
  confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.65 } })
  confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.65 } })
}
