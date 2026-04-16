<template>
  <canvas ref="canvasRef" class="clickSpark" aria-hidden="true" />
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

type Spark = {
  x: number
  y: number
  angle: number
  startTime: number
}

const { theme } = useTheme()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const sparks = ref<Spark[]>([])

const sparkSize = 10
const sparkRadius = 15
const sparkCount = 8
const duration = 400
const easing = 'ease-out'
const extraScale = 1

let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let resizeObserver: ResizeObserver | null = null
let resizeTimeout: ReturnType<typeof setTimeout> | null = null

function reduced(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function sparkColor(){
  return theme.value === 'light' ? '#000' : '#fff'
}

function resizeCanvas(){
  const canvas = canvasRef.value
  if (!canvas || !process.client) return
  const parent = document.documentElement
  const rect = parent.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.round(window.innerWidth))
  const height = Math.max(1, Math.round(window.innerHeight || rect.height))

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
  }

  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function easeFunc(t: number){
  switch (easing) {
    case 'linear':
      return t
    case 'ease-in':
      return t * t
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    default:
      return t * (2 - t)
  }
}

function draw(timestamp: number){
  if (!ctx || !canvasRef.value) return

  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)

  sparks.value = sparks.value.filter(spark => {
    const elapsed = timestamp - spark.startTime
    if (elapsed >= duration) return false

    const progress = elapsed / duration
    const eased = easeFunc(progress)
    const distance = eased * sparkRadius * extraScale
    const lineLength = sparkSize * (1 - eased)

    const x1 = spark.x + distance * Math.cos(spark.angle)
    const y1 = spark.y + distance * Math.sin(spark.angle)
    const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle)
    const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle)

    ctx.strokeStyle = sparkColor()
    ctx.lineWidth = 2
    ctx.globalAlpha = 1 - progress
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    return true
  })

  ctx.globalAlpha = 1

  if (sparks.value.length) raf = requestAnimationFrame(draw)
  else raf = 0
}

function spawn(x: number, y: number){
  const now = performance.now()
  for (let i = 0; i < sparkCount; i++) {
    sparks.value.push({
      x,
      y,
      angle: (Math.PI * 2 * i) / sparkCount,
      startTime: now
    })
  }
  if (!raf) raf = requestAnimationFrame(draw)
}

function onPointerDown(e: PointerEvent){
  if (reduced()) return
  spawn(e.clientX, e.clientY)
}

onMounted(() => {
  if (!process.client || reduced()) return

  resizeCanvas()
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('resize', resizeCanvas)

  resizeObserver = new ResizeObserver(() => {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(resizeCanvas, 100)
  })
  resizeObserver.observe(document.documentElement)
})

onBeforeUnmount(() => {
  if (!process.client) return
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('resize', resizeCanvas)
  if (resizeObserver) resizeObserver.disconnect()
  if (resizeTimeout) clearTimeout(resizeTimeout)
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
