<template>
  <canvas ref="canvasRef" class="liquid-ether-container" aria-hidden="true" />
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

type Blob = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  baseR: number
  color: string
  phase: number
}

const { theme } = useTheme()
const canvasRef = ref<HTMLCanvasElement | null>(null)

const mouseForce = 16
const cursorSize = 80
const autoSpeed = 0.5
const autoIntensity = 2.2

let ctx: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let dpr = 1
let raf = 0
let time = 0

const blobs: Blob[] = []
const mouse = reactive({
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
  active: false,
  lastMove: 0
})

function reduced(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function colors(){
  return theme.value === 'light'
    ? ['#5227FF', '#000000', '#7b5cff']
    : ['#5227FF', '#ffffff', '#8c74ff']
}

function resize(){
  const canvas = canvasRef.value
  if (!canvas || !process.client) return
  width = window.innerWidth
  height = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.filter = 'blur(32px)'
  seedBlobs()
  if (!mouse.x && !mouse.y) {
    mouse.x = width * 0.5
    mouse.y = height * 0.45
    mouse.tx = mouse.x
    mouse.ty = mouse.y
  }
}

function seedBlobs(){
  blobs.length = 0
  const palette = colors()
  const count = 6
  const minSide = Math.min(width, height)
  for (let i = 0; i < count; i++) {
    const baseR = minSide * (0.15 + i * 0.02)
    blobs.push({
      x: width * (0.15 + (i / (count - 1)) * 0.7),
      y: height * (0.25 + ((i % 3) * 0.18)),
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: baseR,
      baseR,
      color: palette[i % palette.length],
      phase: Math.random() * Math.PI * 2
    })
  }
}

function hexToRgba(hex: string, alpha: number){
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const num = parseInt(full, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function drawBlob(x: number, y: number, r: number, color: string, strength = 1){
  if (!ctx) return
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
  const inner = theme.value === 'light' ? 0.11 : 0.22
  const mid = theme.value === 'light' ? 0.05 : 0.1
  grad.addColorStop(0, hexToRgba(color, inner * strength))
  grad.addColorStop(0.45, hexToRgba(color, mid * strength))
  grad.addColorStop(1, hexToRgba(color, 0))
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function updateAutoTarget(){
  const idle = performance.now() - mouse.lastMove > 1000
  if (!idle || mouse.active) return
  const t = time * autoSpeed
  mouse.tx = width * (0.5 + Math.cos(t * 0.7) * 0.18 * autoIntensity / 2.2)
  mouse.ty = height * (0.46 + Math.sin(t * 0.95) * 0.14 * autoIntensity / 2.2)
}

function frame(){
  if (!ctx) return
  time += 0.016
  updateAutoTarget()

  mouse.x += (mouse.tx - mouse.x) * 0.085
  mouse.y += (mouse.ty - mouse.y) * 0.085

  ctx.clearRect(0, 0, width, height)
  ctx.globalCompositeOperation = theme.value === 'light' ? 'multiply' : 'screen'

  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i]
    const sway = Math.sin(time * (0.7 + i * 0.08) + b.phase) * 0.26
    const rise = Math.cos(time * (0.55 + i * 0.09) + b.phase) * 0.22
    b.vx += sway * 0.003
    b.vy += rise * 0.003

    const dx = mouse.x - b.x
    const dy = mouse.y - b.y
    const dist = Math.hypot(dx, dy) + 0.001
    const influence = Math.max(0, (340 - dist) / 340)
    b.vx += (dx / dist) * influence * mouseForce * 0.0024
    b.vy += (dy / dist) * influence * mouseForce * 0.0021
    b.vx *= 0.988
    b.vy *= 0.988
    b.x += b.vx
    b.y += b.vy
    b.r = b.baseR * (1 + influence * 0.12)

    if (b.x < -b.r) b.x = width + b.r
    if (b.x > width + b.r) b.x = -b.r
    if (b.y < -b.r) b.y = height + b.r
    if (b.y > height + b.r) b.y = -b.r

    drawBlob(b.x, b.y, b.r, b.color)
  }

  drawBlob(mouse.x, mouse.y, cursorSize * 1.8, theme.value === 'light' ? '#000000' : '#ffffff', 0.9)
  ctx.globalCompositeOperation = 'source-over'
  raf = requestAnimationFrame(frame)
}

function onPointerMove(e: PointerEvent){
  mouse.active = true
  mouse.lastMove = performance.now()
  mouse.tx = e.clientX
  mouse.ty = e.clientY
}

function onPointerLeave(){
  mouse.active = false
  mouse.lastMove = performance.now() - 1200
}

watch(theme, () => {
  resize()
})

onMounted(() => {
  if (!process.client || reduced()) return
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave, { passive: true })
  mouse.lastMove = performance.now() - 1200
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
.liquid-ether-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
  pointer-events: none;
  z-index: 0;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .liquid-ether-container {
    display: none;
  }
}
</style>
