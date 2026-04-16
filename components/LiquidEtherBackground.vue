<template>
  <canvas ref="canvas" class="etherBg" aria-hidden="true" />
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

type Orb = {
  x: number
  y: number
  vx: number
  vy: number
  baseR: number
  r: number
  color: string
  phase: number
  drift: number
}

const canvas = ref<HTMLCanvasElement | null>(null)
const { theme } = useTheme()

const mouseForce = 16
const cursorSize = 80
const isViscous = true
const viscous = 100
const autoDemo = true
const autoSpeed = 0.5
const autoIntensity = 2.2
const isBounce = false
const resolution = 0.5

let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let width = 0
let height = 0
let dpr = 1
let tick = 0

const mouse = reactive({ x: 0, y: 0, tx: 0, ty: 0, active: false })
const orbs: Orb[] = []

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function palette(){
  return theme.value === 'light'
    ? ['#ffffff', '#5227FF', '#d7ceff']
    : ['#5227FF', '#ffffff', '#d7ceff']
}

function alphaHex(v: number){
  return Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')
}

function resetOrbs(){
  orbs.length = 0
  const colors = palette()
  const base = Math.min(width, height)
  const count = reduce() ? 4 : 6

  for (let i = 0; i < count; i++) {
    const baseR = base * (0.18 + i * 0.022)
    orbs.push({
      x: width * (0.18 + (i / Math.max(1, count - 1)) * 0.64),
      y: height * (0.28 + Math.sin(i * 1.4) * 0.09),
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.14,
      baseR,
      r: baseR,
      color: colors[i % colors.length],
      phase: Math.random() * Math.PI * 2,
      drift: 0.4 + Math.random() * 0.8
    })
  }
}

function resize(){
  const el = canvas.value
  if (!el || !process.client) return
  dpr = Math.min((window.devicePixelRatio || 1) * resolution, 1.5)
  width = window.innerWidth
  height = window.innerHeight
  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)
  el.style.width = `${width}px`
  el.style.height = `${height}px`
  ctx = el.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  resetOrbs()
}

function drawOrb(o: Orb, alpha = 1){
  if (!ctx) return
  const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
  const inner = theme.value === 'light' ? 0.1 : 0.22
  const mid = theme.value === 'light' ? 0.05 : 0.11
  grad.addColorStop(0, `${o.color}${alphaHex(inner * alpha)}`)
  grad.addColorStop(0.48, `${o.color}${alphaHex(mid * alpha)}`)
  grad.addColorStop(1, `${o.color}00`)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
  ctx.fill()
}

function updateAutoCursor(){
  if (!autoDemo || mouse.active) return
  const t = tick * autoSpeed
  const intensity = autoIntensity
  mouse.tx = width * (0.5 + Math.cos(t * 0.63) * 0.22 * intensity / 2.2)
  mouse.ty = height * (0.46 + Math.sin(t * 0.91) * 0.16 * intensity / 2.2)
}

function onPointerMove(e: PointerEvent){
  mouse.tx = e.clientX
  mouse.ty = e.clientY
  mouse.active = true
}

function onPointerLeave(){
  mouse.active = false
}

function frame(){
  if (!ctx) return
  tick += 0.01
  updateAutoCursor()

  const ease = isViscous ? Math.max(0.05, 0.16 - viscous * 0.0008) : 0.18
  mouse.x += (mouse.tx - mouse.x) * ease
  mouse.y += (mouse.ty - mouse.y) * ease

  ctx.clearRect(0, 0, width, height)
  ctx.globalCompositeOperation = theme.value === 'light' ? 'multiply' : 'screen'

  for (let i = 0; i < orbs.length; i++) {
    const o = orbs[i]
    const sway = Math.sin(tick * (0.7 + o.drift) + o.phase)
    const rise = Math.cos(tick * (0.52 + o.drift * 0.6) + o.phase)

    o.vx += sway * 0.0025
    o.vy += rise * 0.002

    const dx = mouse.x - o.x
    const dy = mouse.y - o.y
    const dist = Math.sqrt(dx * dx + dy * dy) + 0.001
    const influence = Math.max(0, (420 - dist) / 420)
    const dir = theme.value === 'light' ? -1 : 1

    o.vx += (dx / dist) * influence * mouseForce * 0.0042 * dir
    o.vy += (dy / dist) * influence * mouseForce * 0.0034 * dir
    o.r = o.baseR * (1 + influence * 0.16)

    o.vx *= 0.988
    o.vy *= 0.988
    o.x += o.vx
    o.y += o.vy

    if (isBounce) {
      if (o.x < o.r || o.x > width - o.r) o.vx *= -0.92
      if (o.y < o.r || o.y > height - o.r) o.vy *= -0.92
      o.x = Math.max(o.r, Math.min(width - o.r, o.x))
      o.y = Math.max(o.r, Math.min(height - o.r, o.y))
    } else {
      if (o.x < -o.r) o.x = width + o.r
      if (o.x > width + o.r) o.x = -o.r
      if (o.y < -o.r) o.y = height + o.r
      if (o.y > height + o.r) o.y = -o.r
    }

    drawOrb(o)
  }

  drawOrb({
    x: mouse.x,
    y: mouse.y,
    vx: 0,
    vy: 0,
    baseR: cursorSize * 1.9,
    r: cursorSize * 1.9,
    color: theme.value === 'light' ? '#ffffff' : '#ffffff',
    phase: 0,
    drift: 0
  }, 0.72)

  ctx.globalCompositeOperation = 'source-over'
  raf = requestAnimationFrame(frame)
}

watch(theme, () => {
  if (!process.client) return
  resetOrbs()
})

onMounted(() => {
  if (!process.client || reduce()) return
  resize()
  mouse.x = width * 0.5
  mouse.y = height * 0.5
  mouse.tx = mouse.x
  mouse.ty = mouse.y
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
  opacity: 1;
  filter: blur(18px) contrast(128%) saturate(115%);
  mix-blend-mode: normal;
}

:global(html[data-theme="light"]) .etherBg {
  filter: blur(16px) contrast(122%) invert(1) saturate(108%);
  opacity: .72;
}

@media (prefers-reduced-motion: reduce) {
  .etherBg {
    display: none;
  }
}
</style>
