<template>
  <div ref="wrap" class="wrap" :class="side" @mouseenter="onEnter" @mouseleave="onLeave">
    <svg class="svg" viewBox="0 0 220 220" aria-hidden="true">
      <path
        v-for="(p, i) in paths"
        :key="i"
        class="arc"
        :class="{ active: i === activeArc }"
        :d="p.d"
        :style="{ strokeWidth: String(p.w), opacity: String(p.o) }"
      />
      <circle class="dot" :cx="dotCx" cy="110" r="2.2" />
      <path class="chev" :d="chevD" />
    </svg>

    <Transition name="count" mode="out-in">
      <div v-if="label" :key="String(label)" class="centerLabel k dim2">( {{ label }} )</div>
    </Transition>

    <button class="hit" :aria-label="side==='left' ? 'Previous' : 'Next'" @click="$emit('activate')" />
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const props = withDefaults(defineProps<{
  side: 'left' | 'right'
  activeArc?: number
  label?: string | number
}>(), { activeArc: 1, label: '' })

defineEmits<{ (e:'activate'):void }>()

// Replace the strict "brackets" with a more organic, calligraphic mark.
// Still minimal — just feels more "drawn" and less UI-like.
type Stroke = { d: string; w: number; o: number }

function leftStrokes(): Stroke[]{
  return [
    { d: 'M 154 18 C 88 44 70 88 92 116 C 114 146 92 176 154 202', w: 1.3, o: 0.22 },
    { d: 'M 148 26 C 94 52 78 90 98 114 C 116 138 98 170 148 194', w: 1.05, o: 0.18 },
    { d: 'M 142 38 C 102 62 92 92 108 112 C 124 132 110 160 142 182', w: 0.9, o: 0.15 },
  ]
}

function rightStrokes(): Stroke[]{
  return [
    { d: 'M 66 18 C 132 44 150 88 128 116 C 106 146 128 176 66 202', w: 1.3, o: 0.22 },
    { d: 'M 72 26 C 126 52 142 90 122 114 C 104 138 122 170 72 194', w: 1.05, o: 0.18 },
    { d: 'M 78 38 C 118 62 128 92 112 112 C 96 132 110 160 78 182', w: 0.9, o: 0.15 },
  ]
}

const paths = computed<Stroke[]>(() => props.side === 'left' ? leftStrokes() : rightStrokes())

const dotCx = computed(() => (props.side === 'left' ? 188 : 32))
const chevD = computed(() => {
  // small inward chevron (subtle, more "gallery" than arrow)
  return props.side === 'left'
    ? 'M 180 110 L 172 104 M 180 110 L 172 116'
    : 'M 40 110 L 48 104 M 40 110 L 48 116'
})

const wrap = ref<HTMLElement | null>(null)
let hoverTl: gsap.core.Timeline | null = null

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

onMounted(() => {
  if (!wrap.value || reduce()) return
  const arcs = wrap.value.querySelectorAll<SVGPathElement>('.arc')
  hoverTl = gsap.timeline({ paused: true })
    .to(wrap.value, { scale: 1.01, duration: 0.22, ease: 'power2.out' }, 0)
    .to(arcs, { opacity: 0.55, duration: 0.22, ease: 'power2.out', stagger: 0.03 }, 0)
})

function onEnter(){ hoverTl?.play() }
function onLeave(){ hoverTl?.reverse() }
</script>

<style scoped>
.wrap{
  position:relative;
  /* Ensure arcs feel equal-to or larger than the project thumbnail on all non-mobile breakpoints */
  width: min(380px, 30vw);
  height: min(560px, 56vh);
  display:flex;
  align-items:center;
  justify-content:center;
  opacity:.95;
  color: var(--fg);
  transform-origin: center;
}
.svg{
  width:100%;
  height:100%;
  transform: scaleY(1.22); /* elongate bracket vertically */
  transform-origin:center;
}
.arc{
  fill:none;
  stroke: currentColor;
  stroke-linecap: round;
  opacity: .22;
}
.arc.active{ opacity: .38; }

.dot{ fill: currentColor; opacity: .38; }
.chev{
  fill:none;
  stroke: currentColor;
  stroke-width: 1;
  stroke-linecap: round;
  opacity: .42;
}

.centerLabel{
  position:absolute;
  top: 50%;
  transform: translateY(-50%);
  opacity: .78;
  pointer-events:none;
}
.left .centerLabel{ right: 74px; }
.right .centerLabel{ left: 74px; }

.hit{
  position:absolute;
  inset:0;
  background:transparent;
  border:0;
  cursor:pointer;
}

@media (max-width: 1024px){
  /* Keep arcs visually comparable to the thumbnail on smaller laptops/tablets */
  .wrap{ width: 210px; height: 360px; }
  .left .centerLabel{ right: 66px; }
  .right .centerLabel{ left: 66px; }
}
@media (max-width: 768px){
  .wrap{ display:none; }
}
</style>

<style scoped>
/* number step / count transition */
.count-enter-active,
.count-leave-active{
  transition: opacity .22s ease, transform .22s ease;
}
.count-enter-from{
  opacity: 0;
  transform: translateY(10px);
}
.count-leave-to{
  opacity: 0;
  transform: translateY(-10px);
}
</style>
