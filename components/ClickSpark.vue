<template>
  <div class="clickSparkWrap" @click="handleClick">
    <canvas ref="canvasRef" class="clickSparkCanvas" aria-hidden="true" />
    <slot />
  </div>
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
const sparksRef = ref<Spark[]>([])

const sparkSize = 10
const sparkRadius = 15
const sparkCount = 8
const duration = 400
const easing = 'ease-out'
const extraScale = 1

let ctx: CanvasRenderingContext2D | null = null
let animationId = 0
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
  if (!canvas) return

  const parent = canvas.parentElement
  if (!parent) return

  const { width, height } = parent.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const nextWidth = Math.max(1, Math.round(width * dpr))
  const nextHeight = Math.max(1, Math.round(height * dpr))

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth
    canvas.height = nextHeight
    canvas.style.width = `${Math.round(width)}px`
    canvas.style.height = `${Math.round(height)}px`
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
  const canvas = canvasRef.value
  if (!canvas || !ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  sparksRef.value = sparksRef.value.filter(spark => {
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
  animationId = requestAnimationFrame(draw)
}

function handleClick(e: MouseEvent){
  if (reduced()) return
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const now = performance.now()

  const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
    x,
    y,
    angle: (2 * Math.PI * i) / sparkCount,
    startTime: now
  }))

  sparksRef.value.push(...newSparks)
}

onMounted(() => {
  if (!process.client || reduced()) return
  const canvas = canvasRef.value
  if (!canvas) return

  resizeCanvas()
  animationId = requestAnimationFrame(draw)

  const parent = canvas.parentElement
  if (!parent) return

  resizeObserver = new ResizeObserver(() => {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(resizeCanvas, 100)
  })
  resizeObserver.observe(parent)
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (resizeObserver) resizeObserver.disconnect()
  if (resizeTimeout) clearTimeout(resizeTimeout)
})
</script>

<style scoped>
.clickSparkWrap {
  position: relative;
  width: 100%;
  min-height: 100svh;
}

.clickSparkCanvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
  pointer-events: none;
  z-index: 9997;
}

@media (prefers-reduced-motion: reduce) {
  .clickSparkCanvas {
    display: none;
  }
}
</style>
