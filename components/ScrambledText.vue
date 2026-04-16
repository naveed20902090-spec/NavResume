<template>
  <div ref="rootRef" class="scrambledText" @pointermove="handleMove">
    <p class="scrambledTextLine">
      <template v-for="(char, index) in renderedChars" :key="index">
        <br v-if="char === '\n'" />
        <span
          v-else
          :ref="el => setCharRef(el, index)"
          class="char"
          :data-content="sourceChars[index] === ' ' ? '\u00A0' : sourceChars[index]"
        >{{ char === ' ' ? '\u00A0' : char }}</span>
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
type ActiveScramble = {
  start: number
  duration: number
  target: string
}

const props = withDefaults(defineProps<{
  text: string
  radius?: number
  duration?: number
  speed?: number
  scrambleChars?: string
}>(), {
  radius: 100,
  duration: 1.2,
  speed: 0.5,
  scrambleChars: '.:'
})

const rootRef = ref<HTMLElement | null>(null)
const charRefs = ref<(HTMLElement | null)[]>([])
const sourceChars = computed(() => Array.from(props.text ?? ''))
const renderedChars = ref<string[]>([])
const active = new Map<number, ActiveScramble>()
let raf = 0

watch(sourceChars, chars => {
  renderedChars.value = [...chars]
  charRefs.value = new Array(chars.length).fill(null)
}, { immediate: true })

function setCharRef(el: Element | ComponentPublicInstance | null, index: number){
  charRefs.value[index] = el as HTMLElement | null
}

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function randomScrambleChar(){
  const pool = props.scrambleChars || '.:'
  return pool[Math.floor(Math.random() * pool.length)] || '.'
}

function tick(now: number){
  let hasActive = false
  const next = [...sourceChars.value]

  for (let i = 0; i < next.length; i++) {
    const item = active.get(i)
    if (!item) continue

    const target = item.target
    if (target === ' ' || target === '\n') {
      active.delete(i)
      next[i] = target
      continue
    }

    const elapsed = now - item.start
    const progress = Math.min(1, elapsed / item.duration)

    if (progress >= 1) {
      active.delete(i)
      next[i] = target
      continue
    }

    hasActive = true
    const settlePoint = 0.72
    next[i] = progress > settlePoint ? target : randomScrambleChar()
  }

  renderedChars.value = next

  if (hasActive) raf = requestAnimationFrame(tick)
  else raf = 0
}

function startCharScramble(index: number, distance: number){
  const target = sourceChars.value[index]
  if (!target || target === ' ' || target === '\n') return

  const durationMs = Math.max(120, props.duration * 1000 * (1 - distance / props.radius))
  active.set(index, {
    start: performance.now(),
    duration: durationMs / Math.max(0.45, props.speed),
    target
  })

  if (!raf) raf = requestAnimationFrame(tick)
}

function handleMove(e: PointerEvent){
  if (reduce()) return
  for (let i = 0; i < charRefs.value.length; i++) {
    const el = charRefs.value[i]
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    const dist = Math.hypot(dx, dy)
    if (dist < props.radius) startCharScramble(i, dist)
  }
}

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
.scrambledText {
  width: 100%;
}

.scrambledTextLine {
  margin: 0;
  white-space: pre-wrap;
}

.char {
  display: inline-block;
  will-change: contents;
}
</style>
