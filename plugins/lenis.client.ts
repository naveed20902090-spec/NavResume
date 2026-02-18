import Lenis from 'lenis'
import gsap from 'gsap'

export default defineNuxtPlugin(() => {
  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 0.9,
    touchMultiplier: 1,
    easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
  })

  // Drive Lenis via GSAP ticker for consistent timing with our animations.
  gsap.ticker.add((time) => {
    // gsap ticker time is seconds; Lenis expects ms
    lenis.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)

  // Expose for debugging
  ;(window as any).lenis = lenis
})
