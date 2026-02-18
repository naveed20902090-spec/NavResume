<template>
  <CursorDot />
  <div ref="layer" class="transitionLayer" aria-hidden="true" />
  <NuxtPage :transition="pageTransition" />
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { useSfx } from '~/composables/useSfx'

const layer = ref<HTMLElement | null>(null)
const { playWhoosh } = useSfx()

function reduced(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function lockScroll(lock: boolean){
  if (!process.client) return
  document.documentElement.style.overflow = lock ? 'hidden' : ''
  document.body.style.overflow = lock ? 'hidden' : ''
}

function animateReveals(root: HTMLElement){
  if (reduced()) return
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
  const lines = Array.from(root.querySelectorAll<HTMLElement>('[data-line]'))
  if (!items.length && !lines.length) return

  // Hairline dividers draw in.
  if (lines.length){
    gsap.fromTo(lines,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 0.55, duration: 0.75, ease: 'power3.out', stagger: 0.06, clearProps: 'transform' }
    )
  }

  const titles = items.filter(el => el.classList.contains('title'))
  const rest = items.filter(el => !el.classList.contains('title'))

  // Typography-first reveal for titles (museum vibe).
  if (titles.length){
    gsap.fromTo(titles,
      { opacity: 0, y: 14, filter: 'blur(6px)', letterSpacing: '0.22em' },
      { opacity: 1, y: 0, filter: 'blur(0px)', letterSpacing: '', duration: 0.85, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,filter,letter-spacing' }
    )
  }

  // Clean reveal for everything else.
  if (rest.length){
    gsap.fromTo(rest,
      { opacity: 0, y: 12, filter: 'blur(2px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.62, ease: 'power3.out', stagger: 0.055, clearProps: 'transform,filter' }
    )
  }
}

const pageTransition = {
  name: 'mb',
  mode: 'out-in',
  css: false,
  onBeforeLeave(){
    lockScroll(true)
    if (process.client) playWhoosh()
  },
  onLeave(el: Element, done: () => void){
    const l = layer.value
    if (!process.client || !l || reduced()){
      if (l) l.style.display = 'none'
      done()
      return
    }
    gsap.killTweensOf([l, el])
    gsap.set(l, { display: 'block', scaleY: 0, transformOrigin: 'top' })
    gsap.to(el, { opacity: 0, scale: 0.995, filter: 'blur(2px)', duration: 0.22, ease: 'power2.inOut', clearProps: 'transform' })
    gsap.to(l, { scaleY: 1, duration: 0.48, ease: 'power4.inOut', onComplete: done })
  },
  onEnter(el: Element, done: () => void){
    const l = layer.value
    if (!process.client || !l || reduced()){
      if (l) l.style.display = 'none'
      lockScroll(false)
      // @ts-expect-error
      animateReveals(el)
      done()
      return
    }

    gsap.killTweensOf([l, el])
    gsap.set(el, { opacity: 0, scale: 1.01, filter: 'blur(3px)' })

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(l, { display: 'none' })
        lockScroll(false)
        done()
      }
    })

    tl.to(el, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.42, ease: 'power3.out', clearProps: 'transform,filter' }, 0.08)
      .to(l, { scaleY: 0, duration: 0.55, transformOrigin: 'bottom', ease: 'power4.inOut' }, 0)

    // @ts-expect-error
    tl.add(() => animateReveals(el as HTMLElement), 0.12)
  }
}
</script>
