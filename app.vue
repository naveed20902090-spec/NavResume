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
  if (!items.length) return
  gsap.fromTo(items,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.62, ease: 'power3.out', stagger: 0.06, clearProps: 'transform' }
  )
}

const pageTransition = {
  name: 'mb',
  mode: 'out-in',
  css: false,
  onBeforeLeave(){
    lockScroll(true)
    if (process.client) playWhoosh()
  },
  onLeave(_el: Element, done: () => void){
    const l = layer.value
    if (!process.client || !l || reduced()){
      if (l) l.style.display = 'none'
      done()
      return
    }
    gsap.killTweensOf(l)
    gsap.set(l, { display: 'block', scaleY: 0, transformOrigin: 'top' })
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

    gsap.killTweensOf(l)
    gsap.set(el, { opacity: 0 })

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(l, { display: 'none' })
        lockScroll(false)
        done()
      }
    })

    tl.to(el, { opacity: 1, duration: 0.18, ease: 'none' }, 0.06)
      .to(l, { scaleY: 0, duration: 0.55, transformOrigin: 'bottom', ease: 'power4.inOut' }, 0)

    // @ts-expect-error
    tl.add(() => animateReveals(el as HTMLElement), 0.16)
  }
}
</script>
