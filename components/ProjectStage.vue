<template>
  <section class="stage" data-reveal>
    <ArcNav side="left" :activeArc="activeArc" :label="prevLabel" @activate="prev" />

    <div class="center">
      <div class="mediaWrap" ref="mediaWrap" @pointerenter="onEnter" @pointermove="onMove" @pointerleave="onLeave">
        <NuxtLink class="mediaLink" :to="`/project/${current.id}`" aria-label="Open project" data-cursor-off="1">
          <div ref="stackEl" class="imgStack" :class="imgFxClass" :data-active="hoverActive ? '1' : '0'" :style="hoverStyle">
            <img
              class="media bw base"
              :src="currentSrc"
              :alt="currentAlt"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
            <img
              class="media color base"
              :src="currentSrc"
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
            />

            <div class="hoverGloss" aria-hidden="true"></div>
            <div class="hoverFrame" aria-hidden="true"></div>

            <div v-if="transitioning" ref="incomingWrap" class="incoming" aria-hidden="true">
              <img class="media bw top" :src="incomingSrc" alt="" aria-hidden="true" loading="eager" decoding="async" />
              <img class="media color top" :src="incomingSrc" alt="" aria-hidden="true" loading="eager" decoding="async" />
            </div>
          </div>
        </NuxtLink>

        <a class="play" :href="current.link" target="_blank" rel="noreferrer" data-cursor>( OPEN )</a>

        <svg class="fx" width="0" height="0" aria-hidden="true" focusable="false">
          <filter id="rippleFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence ref="turb" type="turbulence" baseFrequency="0.012 0.014" numOctaves="1" seed="2" result="noise" />
            <feDisplacementMap ref="disp" in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      </div>

      <div class="meta" ref="metaEl">
        <div class="leftMeta">
          <div class="k">{{ current.title }}</div>
          <div class="k dim2">{{ current.badge }} • {{ current.category.toUpperCase() }}</div>
        </div>

        <div class="rightMeta">
          <div class="k">{{ current.desc }}</div>
          <div class="k dim2">{{ current.metaLine }}</div>
        </div>

        <div class="tags">
          <span v-for="t in current.tags" :key="t" class="k dim2 tag">{{ t }}</span>
        </div>
      </div>
    </div>

    <ArcNav side="right" :activeArc="activeArc" :label="nextLabel" @activate="next" />
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import type { Project } from '~/composables/useProjects'

const props = defineProps<{ projects: Project[]; modelValue: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

const current = computed(() => props.projects[props.modelValue] ?? props.projects[0])
const total = computed(() => props.projects.length || 1)
const prevLabel = computed(() => String(((props.modelValue - 1 + total.value) % total.value) + 1))
const nextLabel = computed(() => String(((props.modelValue + 1) % total.value) + 1))

const currentSrc = ref(current.value.media.src)
const currentAlt = ref(current.value.media.alt)
const incomingSrc = ref('')
const transitioning = ref(false)

const rippleActive = ref(false)
const turb = ref<SVGFETurbulenceElement | null>(null)
const disp = ref<SVGFEDisplacementMapElement | null>(null)
let rippleRaf: number | null = null

const hoverActive = ref(false)
const hx = ref(50)
const hy = ref(50)
let thx = 50
let thy = 50
let hoverRaf: number | null = null

const activeArc = ref(1)

const mediaWrap = ref<HTMLDivElement | null>(null)
const stackEl = ref<HTMLDivElement | null>(null)
const incomingWrap = ref<HTMLDivElement | null>(null)
const metaEl = ref<HTMLDivElement | null>(null)

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function finePointer(){
  if (!process.client) return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function animateMeta(){
  if (!process.client || !metaEl.value || reduce()) return
  gsap.killTweensOf(metaEl.value)
  gsap.fromTo(metaEl.value, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'transform' })
}

function runRipple(duration = 900){
  if (!process.client || reduce() || !turb.value || !disp.value) return
  if (rippleRaf) cancelAnimationFrame(rippleRaf)
  rippleActive.value = true
  const start = performance.now()

  const step = (now: number) => {
    const p = Math.min(1, (now - start) / duration)
    const env = Math.sin(Math.PI * p)
    turb.value?.setAttribute('baseFrequency', `${(0.012 + Math.sin(p * Math.PI * 3) * 0.003).toFixed(4)} ${(0.014 + Math.cos(p * Math.PI * 2.5) * 0.003).toFixed(4)}`)
    disp.value?.setAttribute('scale', `${(18 * env).toFixed(2)}`)
    if (p < 1) rippleRaf = requestAnimationFrame(step)
    else {
      disp.value?.setAttribute('scale', '0')
      rippleActive.value = false
      rippleRaf = null
    }
  }

  rippleRaf = requestAnimationFrame(step)
}

function transitionToMedia(src: string, alt: string){
  if (!process.client || reduce()) {
    currentSrc.value = src
    currentAlt.value = alt
    return
  }

  const wrap = mediaWrap.value
  const stack = stackEl.value
  if (!wrap || !stack) return

  incomingSrc.value = src
  transitioning.value = true

  nextTick(() => {
    const inc = incomingWrap.value
    if (!inc) {
      transitioning.value = false
      currentSrc.value = src
      currentAlt.value = alt
      return
    }

    gsap.killTweensOf([stack, inc, wrap])
    runRipple(980)

    gsap.set(wrap, { willChange: 'transform' })
    gsap.set(inc, { clipPath: 'inset(0 0 0 100%)', '--blur': '2.5px', scale: 1.03, opacity: 1 })
    gsap.set(stack, { '--blur': '0px', scale: 1, opacity: 1 })

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        currentSrc.value = src
        currentAlt.value = alt
        transitioning.value = false
        gsap.set(stack, { '--blur': '0px', scale: 1, opacity: 1 })
        gsap.set(wrap, { clearProps: 'will-change' })
      }
    })

    tl.to(wrap, { duration: 0.28, scale: 0.988 }, 0)
      .to(stack, { duration: 0.28, '--blur': '2px', scale: 1.01, opacity: 0.62 }, 0)
      .to(inc, { duration: 0.62, clipPath: 'inset(0 0 0 0)', '--blur': '0px', scale: 1, opacity: 1 }, 0.08)
      .to(wrap, { duration: 0.62, scale: 1 }, 0.12)
      .to(stack, { duration: 0.62, '--blur': '0px', opacity: 1, scale: 1 }, 0.12)
  })
}

watch(() => props.modelValue, (v, prev) => {
  const p = props.projects[v]
  if (!p) return

  if (typeof prev !== 'number') {
    currentSrc.value = p.media.src
    currentAlt.value = p.media.alt
    animateMeta()
    return
  }

  if (v > prev) activeArc.value = (activeArc.value + 1) % 3
  if (v < prev) activeArc.value = (activeArc.value + 2) % 3

  if (p.media.src !== currentSrc.value || p.media.alt !== currentAlt.value) {
    transitionToMedia(p.media.src, p.media.alt)
  }

  animateMeta()
}, { immediate: true })

function next(){
  emit('update:modelValue', (props.modelValue + 1) % props.projects.length)
}

function prev(){
  emit('update:modelValue', (props.modelValue - 1 + props.projects.length) % props.projects.length)
}

function setHoverTargetFromEvent(e: PointerEvent){
  const el = mediaWrap.value
  if (!el) return
  const r = el.getBoundingClientRect()
  thx = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
  thy = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100))
}

function tickHover(){
  const a = hoverActive.value ? 0.18 : 0.12
  hx.value += (thx - hx.value) * a
  hy.value += (thy - hy.value) * a
  const settled = Math.abs(thx - hx.value) + Math.abs(thy - hy.value) < 0.08
  if (!reduce() && (hoverActive.value || !settled)) hoverRaf = requestAnimationFrame(tickHover)
  else hoverRaf = null
}

function onEnter(e: PointerEvent){
  if (!finePointer()) return
  hoverActive.value = true
  setHoverTargetFromEvent(e)
  if (hoverRaf == null) hoverRaf = requestAnimationFrame(tickHover)
}

function onMove(e: PointerEvent){
  if (!hoverActive.value || !finePointer()) return
  setHoverTargetFromEvent(e)
  if (hoverRaf == null) hoverRaf = requestAnimationFrame(tickHover)
}

function onLeave(){
  hoverActive.value = false
  thx = 50
  thy = 50
  if (hoverRaf == null) hoverRaf = requestAnimationFrame(tickHover)
}

const hoverStyle = computed(() => {
  const dx = (hx.value - 50) / 50
  const dy = (hy.value - 50) / 50
  const px = dx * 7
  const py = dy * 5
  const rx = dy * -2.8
  const ry = dx * 3.8

  return {
    '--mx': `${hx.value}%`,
    '--my': `${hy.value}%`,
    '--px': `${px.toFixed(2)}px`,
    '--py': `${py.toFixed(2)}px`,
    '--rx': `${rx.toFixed(2)}deg`,
    '--ry': `${ry.toFixed(2)}deg`,
    '--colorO': hoverActive.value ? '0.92' : '0.22',
    '--glossO': hoverActive.value ? '1' : '0.42'
  }
})

const imgFxClass = computed(() => rippleActive.value ? 'swapRipple' : '')

onBeforeUnmount(() => {
  if (rippleRaf) cancelAnimationFrame(rippleRaf)
  if (hoverRaf) cancelAnimationFrame(hoverRaf)
  try { disp.value?.setAttribute('scale', '0') } catch {}
})
</script>

<style scoped>
.stage {
  flex: 1;
  display: grid;
  grid-template-columns: auto minmax(0, 760px) auto;
  align-items: center;
  column-gap: clamp(18px, 3.6vw, 56px);
  justify-content: center;
  padding-top: clamp(10px, 2.8vh, 24px);
  padding-bottom: clamp(18px, 4.6vh, 44px);
}

.center {
  justify-self: center;
  width: min(760px, 76vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.mediaWrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  position: relative;
  background: color-mix(in srgb, var(--fg) 5%, var(--bg));
  border: 1px solid color-mix(in srgb, var(--fg) 10%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--fg) 4%, transparent) inset,
    0 24px 80px color-mix(in srgb, var(--fg) 4%, transparent);
}

.mediaWrap::before,
.mediaWrap::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.mediaWrap::before {
  background: linear-gradient(180deg, color-mix(in srgb, var(--bg) 16%, transparent), transparent 24%, transparent 72%, color-mix(in srgb, var(--bg) 32%, transparent));
}

.mediaWrap::after {
  background: radial-gradient(circle at 50% 12%, color-mix(in srgb, var(--fg) 7%, transparent), transparent 36%);
  mix-blend-mode: screen;
}

.mediaLink {
  position: absolute;
  inset: 0;
  display: block;
  perspective: 1200px;
}

.imgStack {
  position: absolute;
  inset: 0;
  --mx: 50%;
  --my: 50%;
  --px: 0px;
  --py: 0px;
  --rx: 0deg;
  --ry: 0deg;
  --colorO: 0.22;
  --glossO: 0.42;
  will-change: transform;
  transform: translate3d(var(--px), var(--py), 0) rotateX(var(--rx)) rotateY(var(--ry)) scale(1.015);
  transition: transform .28s ease;
}

.media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  will-change: transform, clip-path, filter, opacity;
  --blur: 0px;
  filter: blur(var(--blur));
}

.media.bw {
  filter: grayscale(1) contrast(1.06) brightness(0.84) blur(var(--blur));
  transform: scale(1.015);
}

.media.color {
  position: absolute;
  inset: 0;
  opacity: var(--colorO);
  filter: saturate(1.02) contrast(1.04) brightness(.94) blur(var(--blur));
  transform: scale(1.04);
  transition: opacity .28s ease;
}

.hoverGloss,
.hoverFrame {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hoverGloss {
  background:
    radial-gradient(360px circle at var(--mx) var(--my), color-mix(in srgb, var(--fg) 11%, transparent), transparent 52%),
    linear-gradient(135deg, color-mix(in srgb, var(--fg) 10%, transparent), transparent 34%, transparent 68%, color-mix(in srgb, var(--fg) 7%, transparent));
  mix-blend-mode: screen;
  opacity: var(--glossO);
  transition: opacity .28s ease;
}

.hoverFrame {
  border: 1px solid color-mix(in srgb, var(--fg) 14%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--fg) 4%, transparent);
}

.incoming {
  position: absolute;
  inset: 0;
}

.media.top {
  position: absolute;
  inset: 0;
}

.imgStack.swapRipple {
  filter: url(#rippleFilter);
}

.play {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: blur(6px);
  transition: opacity .18s ease, border-color .18s ease;
  z-index: 3;
}

.play:hover {
  border-color: color-mix(in srgb, var(--fg) 24%, var(--bg));
  opacity: .75;
}

.meta {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 16px 18px;
  align-items: start;
  border: 1px solid color-mix(in srgb, var(--fg) 10%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--fg) 3.5%, transparent), color-mix(in srgb, var(--bg) 94%, transparent));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--fg) 4%, transparent) inset;
}

.leftMeta {
  justify-self: start;
}

.rightMeta {
  justify-self: end;
  text-align: right;
  max-width: 340px;
}

.leftMeta .k:first-child {
  font-size: calc(var(--fs) * 1.22);
}

.tags {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
}

.tag {
  border: 1px solid var(--line);
  padding: 6px 8px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .play,
  .imgStack,
  .media.color,
  .hoverGloss {
    transition: none;
  }
}

@media (max-width: 1024px) {
  .stage {
    grid-template-columns: auto minmax(0, 640px) auto;
    column-gap: clamp(10px, 2.4vw, 28px);
  }

  .center {
    width: min(640px, 78vw);
  }
}

@media (max-width: 768px) {
  .stage {
    grid-template-columns: 1fr;
    padding-top: 2vh;
    padding-bottom: 2vh;
  }

  .center {
    width: min(560px, 92vw);
  }

  .meta {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .rightMeta {
    justify-self: start;
    text-align: left;
    max-width: none;
  }

  .tags {
    justify-content: flex-start;
  }
}
</style>
