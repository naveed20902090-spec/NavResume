<template>
  <div ref="dot" class="cursorDot" aria-hidden="true" />
</template>

<script setup lang="ts">
import gsap from 'gsap'

const dot = ref<HTMLElement | null>(null)

function prefersReduce(){
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

onMounted(() => {
  if (!dot.value) return
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (!finePointer) return

  const el = dot.value
  gsap.set(el, { x: window.innerWidth / 2, y: window.innerHeight / 2 })

  const dur = prefersReduce() ? 0 : 0.22
  const xTo = gsap.quickTo(el, 'x', { duration: dur, ease: 'power3' })
  const yTo = gsap.quickTo(el, 'y', { duration: dur, ease: 'power3' })

  const onMove = (e: MouseEvent) => {
    xTo(e.clientX)
    yTo(e.clientY)
  }

  const onOver = (e: Event) => {
    const t = e.target as HTMLElement | null
    if (!t) return
    // Allow specific regions to opt out of the cursor enlarging.
    if (t.closest('[data-cursor-off]')) return
    if (t.closest('a,button,[data-cursor]')){
      gsap.to(el, { scale: 2.2, opacity: 0.18, duration: prefersReduce() ? 0 : 0.18, ease: 'power2.out' })
    }
  }

  const onOut = (e: Event) => {
    const t = e.target as HTMLElement | null
    if (!t) return
    if (t.closest('[data-cursor-off]')) return
    if (t.closest('a,button,[data-cursor]')){
      gsap.to(el, { scale: 1, opacity: 0.12, duration: prefersReduce() ? 0 : 0.18, ease: 'power2.out' })
    }
  }

  window.addEventListener('mousemove', onMove, { passive: true })
  document.addEventListener('pointerover', onOver, { passive: true })
  document.addEventListener('pointerout', onOut, { passive: true })

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onMove)
    document.removeEventListener('pointerover', onOver)
    document.removeEventListener('pointerout', onOut)
  })
})
</script>
