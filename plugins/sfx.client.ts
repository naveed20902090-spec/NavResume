import { useSfx } from '~/composables/useSfx'

function closestClickable(el: Element | null){
  if (!el) return null
  return (el as HTMLElement).closest('a,button,[role="button"],input[type="range"]') as HTMLElement | null
}

function isInternalHref(href: string){
  // Treat route-like paths as internal. NuxtLink renders <a href="/path">.
  return href.startsWith('/') && !href.startsWith('//')
}

export default defineNuxtPlugin(() => {
  const { resume, playHover, playNav, playClick } = useSfx()

  // Unlock audio on first gesture
  if (process.client){
    window.addEventListener('pointerdown', () => resume(), { once: true, capture: true })
  }

  let last: Element | null = null
  let hoverCooldown = 0

  const onOver = (e: Event) => {
    const t = e.target as Element | null
    const c = closestClickable(t)
    if (!c || c === last) return

    // keep hover SFX museum-quiet: debounce
    const now = Date.now()
    if (now - hoverCooldown < 70) return
    hoverCooldown = now

    last = c
    playHover()
  }

  const onOut = (e: Event) => {
    const t = e.target as Element | null
    const c = closestClickable(t)
    if (c && c === last) last = null
  }

  const onClick = (e: Event) => {
    const t = e.target as Element | null
    const c = closestClickable(t)
    if (!c) return

    // Navigation menu clicks: extremely subtle (whoosh handles the “impact”).
    if (c.closest('.hdr') && (c.classList.contains('navItem') || c.classList.contains('contact') || c.closest('.navItem') || c.closest('.contact'))){
      playNav()
      return
    }

    // Internal route links: keep click subtle to avoid stacking with transition whoosh.
    const a = c.closest('a') as HTMLAnchorElement | null
    if (a){
      const href = (a.getAttribute('href') || '').trim()
      if (href && isInternalHref(href)){
        playNav()
        return
      }
    }

    playClick()
  }

  document.addEventListener('pointerover', onOver, { passive: true, capture: true })
  document.addEventListener('pointerout', onOut, { passive: true, capture: true })
  document.addEventListener('click', onClick, { passive: true, capture: true })
})
