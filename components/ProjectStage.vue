<template>
  <section class="stage" data-reveal>
    <ArcNav side="left" :activeArc="activeArc" :label="prevLabel" @activate="prev" />

    <div class="center">
      <div class="mediaWrap" ref="mediaWrap">
        <NuxtLink class="mediaLink" :to="`/project/${current.id}`" aria-label="Open project" data-cursor>
          <div
            ref="stackEl"
            class="imgStack"
            :class="imgFxClass"
            :data-active="hoverActive ? '1' : '0'"
            :style="hoverStyle"
            @pointerenter="onEnter"
            @pointermove="onMove"
            @pointerleave="onLeave"
          >
            <!-- Color base (revealed under grayscale mask) -->
            <img
              class="media color base"
              :src="currentSrc"
              :alt="currentAlt"
              ref="baseColorImg"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
            <!-- Grayscale mask on top (hole reveals color near cursor) -->
            <img
              class="media gray base"
              :src="currentSrc"
              alt=""
              aria-hidden="true"
              ref="baseGrayImg"
              loading="eager"
              decoding="async"
            />

            <div v-if="transitioning" ref="incomingWrap" class="incoming" aria-hidden="true">
              <img class="media color top" :src="incomingSrc" :alt="incomingAlt" loading="eager" decoding="async" />
              <img class="media gray top" :src="incomingSrc" alt="" aria-hidden="true" loading="eager" decoding="async" />
            </div>

            <!-- Pointer halo + ripple rings (visual only) -->
            <div class="water" aria-hidden="true"></div>
          </div>
        </NuxtLink>
        <a class="play" :href="current.link" target="_blank" rel="noreferrer" data-cursor>( OPEN )</a>

        <!-- SVG ripple filter (used only during media transitions) -->
        <svg class="fx" width="0" height="0" aria-hidden="true" focusable="false">
          <filter id="rippleFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence ref="turb" type="turbulence" baseFrequency="0.012 0.014" numOctaves="1" seed="2" result="noise" />
            <feDisplacementMap ref="disp" in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <!-- Hover ripple (subtle water distortion under cursor motion) -->
          <filter id="hoverRippleFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence ref="turbHover" type="turbulence" baseFrequency="0.010 0.012" numOctaves="1" seed="7" result="noise2" />
            <feDisplacementMap ref="dispHover" in="SourceGraphic" in2="noise2" scale="0" xChannelSelector="R" yChannelSelector="G" />
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
const emit = defineEmits<{ (e:'update:modelValue', v:number):void }>()

const current = computed(() => props.projects[props.modelValue] ?? props.projects[0])
const total = computed(() => props.projects.length || 1)
const prevLabel = computed(() => {
  const i = (props.modelValue - 1 + total.value) % total.value
  return String(i + 1)
})
const nextLabel = computed(() => {
  const i = (props.modelValue + 1) % total.value
  return String(i + 1)
})

const currentSrc = ref(current.value.media.src)
const currentAlt = ref(current.value.media.alt)
const incomingSrc = ref('')
const incomingAlt = ref('')
const transitioning = ref(false)

// Swap ripple distortion during project media swap.
const rippleActive = ref(false)
const turb = ref<SVGFETurbulenceElement | null>(null)
const disp = ref<SVGFEDisplacementMapElement | null>(null)
let rippleRaf: number | null = null

// Hover reveal + ripple (pointer interaction)
const hoverActive = ref(false)
const hx = ref(50)
const hy = ref(50)
let thx = 50
let thy = 50
let hoverRaf: number | null = null
let lastMoveT = 0
let lastMoveX = 0
let lastMoveY = 0
const rippleEnergy = ref(0)

const turbHover = ref<SVGFETurbulenceElement | null>(null)
const dispHover = ref<SVGFEDisplacementMapElement | null>(null)

const activeArc = ref(1)

const mediaWrap = ref<HTMLDivElement | null>(null)
const stackEl = ref<HTMLDivElement | null>(null)
const incomingWrap = ref<HTMLDivElement | null>(null)
const baseColorImg = ref<HTMLImageElement | null>(null)
const baseGrayImg = ref<HTMLImageElement | null>(null)
const metaEl = ref<HTMLDivElement | null>(null)

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function animateMeta(){
  if (!process.client || !metaEl.value || reduce()) return
  gsap.killTweensOf(metaEl.value)
  gsap.fromTo(metaEl.value, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'transform' })
}

function transitionToMedia(src: string, alt: string){
  if (!process.client || reduce()){
    currentSrc.value = src
    currentAlt.value = alt
    return
  }

  const wrap = mediaWrap.value
  const stack = stackEl.value
  if (!wrap || !stack) return

  incomingSrc.value = src
  incomingAlt.value = alt
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

    // Subtle water-ripple distortion during the swap.
    runRipple(1050)

    gsap.set(inc, { clipPath: 'inset(0 0 0 100%)', '--blur': '2px', scale: 1.02 })
    gsap.set(stack, { '--blur': '0px', scale: 1 })

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        currentSrc.value = src
        currentAlt.value = alt
        transitioning.value = false
        gsap.set(stack, { '--blur': '0px', scale: 1 })
      }
    })

    tl.to(wrap, { duration: 0.22, scale: 0.992 }, 0)
      .to(stack, { duration: 0.22, '--blur': '1.5px', scale: 1.01, opacity: 0.7 }, 0)
      .to(inc, { duration: 0.46, clipPath: 'inset(0 0 0 0)', '--blur': '0px', scale: 1, opacity: 1 }, 0.06)
      .to(wrap, { duration: 0.48, scale: 1 }, 0.10)
      .to(stack, { duration: 0.48, '--blur': '0px', opacity: 1, scale: 1 }, 0.10)
  })
}

function runRipple(duration = 900){
  if (!process.client || reduce()) return
  if (!turb.value || !disp.value) return

  if (rippleRaf) cancelAnimationFrame(rippleRaf)
  rippleRaf = null

  rippleActive.value = true
  const start = performance.now()

  const baseX = 0.012
  const baseY = 0.014
  const ampX = 0.004
  const ampY = 0.004
  const maxScale = 18

  const step = (now: number) => {
    const p = Math.min(1, (now - start) / duration)
    const env = Math.sin(Math.PI * p) // 0 → 1 → 0

    const wobble = 2 * Math.PI * p * 1.25
    const fx = baseX + ampX * Math.sin(wobble)
    const fy = baseY + ampY * Math.cos(wobble * 0.92)
    turb.value?.setAttribute('baseFrequency', `${fx.toFixed(4)} ${fy.toFixed(4)}`)

    const scale = maxScale * env
    disp.value?.setAttribute('scale', `${scale.toFixed(2)}`)

    if (p < 1){
      rippleRaf = requestAnimationFrame(step)
    } else {
      disp.value?.setAttribute('scale', '0')
      rippleActive.value = false
      rippleRaf = null
    }
  }

  rippleRaf = requestAnimationFrame(step)
}

watch(() => props.modelValue, (v, prev) => {
  const p = props.projects[v]
  if (!p) return

  // first render: just seed state (no swap animation)
  if (typeof prev !== 'number') {
    currentSrc.value = p.media.src
    currentAlt.value = p.media.alt
    animateMeta()
    return
  }

  // gentle arc shift (purely cosmetic)
  if (v > prev) activeArc.value = (activeArc.value + 1) % 3
  if (v < prev) activeArc.value = (activeArc.value + 2) % 3

  // avoid redundant work
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

function finePointer(){
  if (!process.client) return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function setHoverTargetFromEvent(e: PointerEvent){
  const el = mediaWrap.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * 100
  const y = ((e.clientY - r.top) / r.height) * 100
  thx = Math.max(0, Math.min(100, x))
  thy = Math.max(0, Math.min(100, y))
}

function tickHover(){
  hoverRaf = null
  // flowy follow
  const a = hoverActive.value ? 0.16 : 0.10
  hx.value = hx.value + (thx - hx.value) * a
  hy.value = hy.value + (thy - hy.value) * a

  // decay ripple energy
  rippleEnergy.value = Math.max(0, rippleEnergy.value * 0.92 - 0.002)

  // drive subtle displacement while hovering / moving
  if (process.client && !reduce() && turbHover.value && dispHover.value) {
    const t = performance.now() * 0.001
    const baseX = 0.010
    const baseY = 0.012
    const wob = 0.0032
    const fx = baseX + wob * Math.sin(t * 1.4 + hx.value * 0.03)
    const fy = baseY + wob * Math.cos(t * 1.1 + hy.value * 0.03)
    turbHover.value.setAttribute('baseFrequency', `${fx.toFixed(4)} ${fy.toFixed(4)}`)

    const scale = (hoverActive.value ? 6 : 0) + rippleEnergy.value * 26
    dispHover.value.setAttribute('scale', `${Math.max(0, Math.min(32, scale)).toFixed(2)}`)
  }

  // parallax (very subtle)
  if (process.client && stackEl.value && mediaWrap.value && hoverActive.value && !reduce()) {
    const r = mediaWrap.value.getBoundingClientRect()
    const dx = (hx.value / 100 - 0.5)
    const dy = (hy.value / 100 - 0.5)
    gsap.to(stackEl.value, { x: dx * 10, y: dy * 6, duration: 0.35, ease: 'power3.out' })
  }

  const near = Math.abs(thx - hx.value) + Math.abs(thy - hy.value) < 0.06
  if (hoverActive.value || rippleEnergy.value > 0.01 || !near) {
    hoverRaf = requestAnimationFrame(tickHover)
  } else {
    // reset hover ripple filter when idle
    try{ dispHover.value?.setAttribute('scale', '0') } catch {}
  }
}

function onEnter(e: PointerEvent){
  if (!finePointer()) return
  hoverActive.value = true
  setHoverTargetFromEvent(e)
  lastMoveT = performance.now()
  lastMoveX = e.clientX
  lastMoveY = e.clientY
  if (hoverRaf == null) hoverRaf = requestAnimationFrame(tickHover)
}

function onMove(e: PointerEvent){
  if (!hoverActive.value || !finePointer()) return
  setHoverTargetFromEvent(e)

  // ripple impulse from mouse speed
  const now = performance.now()
  const dt = Math.max(16, now - lastMoveT)
  const dx = e.clientX - lastMoveX
  const dy = e.clientY - lastMoveY
  const v = Math.sqrt(dx*dx + dy*dy) / dt // px/ms
  rippleEnergy.value = Math.min(1.0, rippleEnergy.value + v * 0.9)
  lastMoveT = now
  lastMoveX = e.clientX
  lastMoveY = e.clientY

  if (hoverRaf == null) hoverRaf = requestAnimationFrame(tickHover)
}

function onLeave(){
  hoverActive.value = false
  // ease back to center
  thx = 50
  thy = 50
  if (process.client && stackEl.value && !reduce()) {
    gsap.to(stackEl.value, { x: 0, y: 0, duration: 0.55, ease: 'power3.out' })
  }
  if (hoverRaf == null) hoverRaf = requestAnimationFrame(tickHover)
}

const hoverStyle = computed(() => ({
  '--mx': `${hx.value}%`,
  '--my': `${hy.value}%`,
  '--waterO': String(Math.min(0.85, 0.10 + rippleEnergy.value * 0.65))
}))

const imgFxClass = computed(() => {
  if (rippleActive.value) return 'swapRipple'
  if (hoverActive.value || rippleEnergy.value > 0.01) return 'hoverRipple'
  return ''
})

onBeforeUnmount(() => {
  if (rippleRaf) cancelAnimationFrame(rippleRaf)
  rippleRaf = null
  rippleActive.value = false
  try{ disp.value?.setAttribute('scale', '0') } catch { /* ignore */ }

  if (hoverRaf) cancelAnimationFrame(hoverRaf)
  hoverRaf = null
  hoverActive.value = false
  try{ dispHover.value?.setAttribute('scale', '0') } catch { /* ignore */ }
})
</script>

<style scoped>
.stage{
  flex:1;
  display:grid;
  grid-template-columns: auto minmax(0, 640px) auto;
  align-items:center;
  column-gap: clamp(18px, 3.6vw, 56px);
  justify-content:center;
  padding-top: clamp(26px, 5.6vh, 54px);
  padding-bottom: clamp(18px, 4.6vh, 44px);
}
.center{
  justify-self:center;
  width:min(620px, 64vw);
  display:flex;
  flex-direction:column;
  align-items:center;
  gap: 14px;
}
.mediaWrap{
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow:hidden;
  position:relative;
  background: color-mix(in srgb, var(--fg) 5%, var(--bg));
}
.mediaLink{
  position:absolute;
  inset:0;
  display:block;
}

@property --revealR{
  syntax: "<length>";
  inherits: true;
  initial-value: 0px;
}

.imgStack{
  position:absolute;
  inset:0;
  --mx: 50%;
  --my: 50%;
  --revealR: 0px;
  --waterO: 0;
  transition: --revealR .18s ease;
  will-change: transform;
}
.imgStack[data-active="1"]{ --revealR: 120px; }

.media{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  will-change: transform, clip-path, filter, opacity;
  --blur: 0px;
  filter: blur(var(--blur));
}

/* Default: thumbnails appear black & white via masked grayscale layer */
.media.gray{ filter: grayscale(1) contrast(1.02) blur(var(--blur));
  mask-image: radial-gradient(circle var(--revealR) at var(--mx) var(--my), transparent 0%, transparent 58%, rgba(0,0,0,1) 72%, rgba(0,0,0,1) 100%);
  -webkit-mask-image: radial-gradient(circle var(--revealR) at var(--mx) var(--my), transparent 0%, transparent 58%, rgba(0,0,0,1) 72%, rgba(0,0,0,1) 100%);
}
.incoming{ position:absolute; inset:0; }
.media.top{ position:absolute; inset:0; }

/* Swap ripple distortion during project change (applied on the stack so grayscale stays intact) */
.imgStack.swapRipple{ filter: url(#rippleFilter); }

/* Hover ripple distortion */
.imgStack.hoverRipple{ filter: url(#hoverRippleFilter); }

.water{
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity: var(--waterO);
  mix-blend-mode: overlay;
  background:
    radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.12) 0, rgba(255,255,255,0) 52%),
    repeating-radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.0) 0 10px, rgba(255,255,255,.10) 10px 11px, rgba(255,255,255,.0) 11px 24px);
  filter: blur(0.35px);
}
.play{
  position:absolute;
  right: 10px;
  bottom: 10px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: blur(6px);
  transition: opacity .18s ease, border-color .18s ease;
}
.play:hover{ border-color: color-mix(in srgb, var(--fg) 24%, var(--bg)); opacity: .75; }

.meta{
  width:100%;
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 0 2px;
  align-items:start;
}
.leftMeta{ justify-self:start; }
.rightMeta{ justify-self:end; text-align:right; max-width: 340px; }
.tags{
  grid-column: 1 / -1;
  display:flex;
  flex-wrap:wrap;
  gap: 10px;
  justify-content:flex-end;
}
.tag{
  border:1px solid var(--line);
  padding: 6px 8px;
}

@media (prefers-reduced-motion: reduce){
  .play{ transition:none; }
}

@media (max-width: 1024px){
  /* Balance arcs + thumbnail so arcs remain equal-to or larger than media height */
  .stage{ grid-template-columns: auto minmax(0, 600px) auto; column-gap: clamp(10px, 2.4vw, 28px); }
  .center{ width:min(540px, 70vw); }
}
@media (max-width: 768px){
  .stage{
    grid-template-columns: 1fr;
    padding-top: 4.5vh;
    padding-bottom: 2vh;
  }
  .center{ width: min(560px, 92vw); }
  .meta{ grid-template-columns: 1fr; gap: 10px; }
  .rightMeta{ justify-self:start; text-align:left; max-width: none; }
  .tags{ justify-content:flex-start; }
}
</style>
