<template>
  <canvas ref="canvas" class="etherBg" aria-hidden="true" />
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

type Blob = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
}

const canvas = ref<HTMLCanvasElement | null>(null)
const { theme } = useTheme()

let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let width = 0
let height = 0
let dpr = 1
let tick = 0

const mouse = reactive({ x: 0, y: 0, active: false })
const blobs: Blob[] = []

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function palette(){
  return theme.value === 'light'
    ? ['#000000', '#5227ff', '#9e8dff']
    : ['#ffffff', '#5227ff', '#9e8dff']
}

function resetBlobs(){
  blobs.length = 0
  const colors = palette()
  const count = reduce() ? 4 : 7
  for (let i = 0; i < count; i++) {
    blobs.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.min(width, height) * (0.12 + Math.random() * 0.12),
      color: colors[i % colors.length]
    })
  }
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
  resetBlobs()
}

function onPointerMove(e: PointerEvent){
  mouse.x = e.clientX
  mouse.y = e.clientY
  mouse.active = true
}

function onPointerLeave(){
  mouse.active = false
}

function drawBlob(b: Blob, alpha = 1){
  if (!ctx) return
  const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
  if (theme.value === 'light') {
    grad.addColorStop(0, `${b.color}${Math.round(255 * 0.16 * alpha).toString(16).padStart(2, '0')}`)
    grad.addColorStop(0.42, `${b.color}${Math.round(255 * 0.08 * alpha).toString(16).padStart(2, '0')}`)
  } else {
    grad.addColorStop(0, `${b.color}${Math.round(255 * 0.18 * alpha).toString(16).padStart(2, '0')}`)
    grad.addColorStop(0.42, `${b.color}${Math.round(255 * 0.09 * alpha).toString(16).padStart(2, '0')}`)
  }
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
  ctx.fill()
}

function frame(){
  if (!ctx) return
  tick += 0.0035
  ctx.clearRect(0, 0, width, height)
  ctx.globalCompositeOperation = theme.value === 'light' ? 'multiply' : 'screen'

  const force = reduce() ? 8 : 16
  blobs.forEach((b, i) => {
    const driftX = Math.sin(tick * (0.8 + i * 0.14)) * 0.08
    const driftY = Math.cos(tick * (0.65 + i * 0.12)) * 0.08
    b.vx += driftX * 0.002
    b.vy += driftY * 0.002

    if (mouse.active) {
      const dx = b.x - mouse.x
      const dy = b.y - mouse.y
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.001
      const pull = Math.max(0, (380 - dist) / 380)
      const sign = theme.value === 'light' ? -1 : 1
      b.vx += (dx / dist) * pull * force * 0.0025 * sign
      b.vy += (dy / dist) * pull * force * 0.0022 * sign
    }

    b.vx *= 0.992
    b.vy *= 0.992
    b.x += b.vx
    b.y += b.vy

    if (b.x < -b.r) b.x = width + b.r
    if (b.x > width + b.r) b.x = -b.r
    if (b.y < -b.r) b.y = height + b.r
    if (b.y > height + b.r) b.y = -b.r

    drawBlob(b)
  })

  if (mouse.active) {
    drawBlob({ x: mouse.x, y: mouse.y, vx: 0, vy: 0, r: reduce() ? 120 : 160, color: theme.value === 'light' ? '#000000' : '#ffffff' }, 0.75)
  }

  ctx.globalCompositeOperation = 'source-over'
  raf = requestAnimationFrame(frame)
}

watch(theme, () => {
  if (!process.client) return
  resetBlobs()
})

onMounted(() => {
  if (!process.client || reduce()) return
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave, { passive: true })
  raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  if (!process.client) return
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerleave', onPointerLeave)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
.etherBg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: .92;
}

@media (prefers-reduced-motion: reduce) {
  .etherBg {
    display: none;
  }
}
</style>
