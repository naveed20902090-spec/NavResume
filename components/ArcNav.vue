<template>
  <div ref="wrap" class="wrap" :class="side" @mouseenter="onEnter" @mouseleave="onLeave">
    <svg class="svg" viewBox="0 0 220 220" aria-hidden="true">
      <path v-for="(d, i) in paths" :key="i" class="arc" :class="{ active: i === activeArc }" :d="d" />
      <polygon class="tri" :points="triPoints" />
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

// Make arcs face inward toward the project:
// left side uses sweep=0 (bulges left => "(")
// right side uses sweep=1 (bulges right => ")")
const sweep = computed(() => (props.side === 'left' ? 0 : 1))
const paths = computed(() => {
  const s = sweep.value
  return [
    `M 110 18 A 92 92 0 0 ${s} 110 202`,
    `M 110 30 A 80 80 0 0 ${s} 110 190`,
    `M 110 44 A 66 66 0 0 ${s} 110 176`,
  ]
})

const triPoints = computed(() => {
  // small pointer on the inner edge, pointing toward the project
  return props.side === 'left'
    ? '202 110 196 106 196 114'  // >
    : '18 110 24 106 24 114'     // <
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
  stroke-width: 1;
  stroke-linecap: round;
  opacity: .22;
}
.arc.active{ opacity: .38; }
.tri{ fill: currentColor; opacity: .55; }

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
