<template>
  <canvas ref="canvas" class="clickSpark" aria-hidden="true" />
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  length: number
}

const canvas = ref<HTMLCanvasElement | null>(null)
const { theme } = useTheme()

let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let width = 0
let height = 0
let dpr = 1
const sparks: Spark[] = []

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function resize(){
  const el = canvas.value
  if (!el || !process.client) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = window.innerWidth
  height = window.innerHeight
  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)
  el.style.width = `${width}px`
  el.style.height = `${height}px`
  ctx = el.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function color(){
  return theme.value === 'light' ? '#000000' : '#ffffff'
}

function burst(x: number, y: number){
  const count = 12
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.24
    const speed = 2.6 + Math.random() * 2.8
    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 18 + Math.random() * 10,
      length: 10 + Math.random() * 12
    })
  }
  if (!raf) raf = requestAnimationFrame(frame)
}

function frame(){
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = color()
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'

  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]
    s.life += 1
    s.x += s.vx
    s.y += s.vy
    s.vx *= 0.96
    s.vy *= 0.96
    const alpha = Math.max(0, 1 - s.life / s.maxLife)
    const nx = s.x - s.vx * s.length * 0.45
    const ny = s.y - s.vy * s.length * 0.45
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.moveTo(s.x, s.y)
    ctx.lineTo(nx, ny)
    ctx.stroke()

    if (s.life >= s.maxLife) sparks.splice(i, 1)
  }

  ctx.globalAlpha = 1

  if (sparks.length) raf = requestAnimationFrame(frame)
  else raf = 0
}

function onPointerDown(e: PointerEvent){
  if (reduce()) return
  burst(e.clientX, e.clientY)
}

onMounted(() => {
  if (!process.client || reduce()) return
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
})

onBeforeUnmount(() => {
  if (!process.client) return
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointerdown', onPointerDown)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
.clickSpark {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9997;
}

@media (prefers-reduced-motion: reduce) {
  .clickSpark {
    display: none;
  }
}
</style>
