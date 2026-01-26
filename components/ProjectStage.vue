<template>
  <section class="stage" data-reveal>
    <ArcNav side="left" :activeArc="activeArc" :label="prevLabel" @activate="prev" />

    <div class="center">
      <div class="mediaWrap" ref="mediaWrap">
        <NuxtLink class="mediaLink" :to="`/project/${current.id}`" aria-label="Open project" data-cursor-off="1">
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
            <!-- B&W base (always visible) -->
            <img
              class="media bw base"
              :src="currentSrc"
              :alt="currentAlt"
              ref="baseBwImg"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
            <!-- Color overlay (revealed only by ripple waves) -->
            <img
              class="media color base"
              :src="currentSrc"
              alt=""
              aria-hidden="true"
              ref="baseColorImg"
              loading="eager"
              decoding="async"
            />

            <div v-if="transitioning" ref="incomingWrap" class="incoming" aria-hidden="true">
              <img class="media bw top" :src="incomingSrc" alt="" aria-hidden="true" loading="eager" decoding="async" />
              <img class="media color top" :src="incomingSrc" alt="" aria-hidden="true" loading="eager" decoding="async" />
            </div>

            <!-- Ripple rings (visual only) -->
            <div class="ripples" aria-hidden="true"></div>
          </div>
        </NuxtLink>
        <a class="play" :href="current.link" target="_blank" rel="noreferrer" data-cursor>( OPEN )</a>

        <!-- SVG ripple filter (used only during media transitions) -->
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

// Cursor-origin ripples (waves) that reveal color only along the wavefronts.
type Wave = { x:number; y:number; r:number; a:number; w:number; vr:number }
let waves: Wave[] = []
let lastWaveEmit = 0
let lastTick = 0
let diagPx = 900

const waveMask = ref('radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0 100%)')
const waveVis = ref('none')
const colorO = ref(0)

function ringMask(w: Wave){
  const r0 = Math.max(0, w.r - w.w)
  const r1 = w.r + w.w
  const f = Math.min(16, Math.max(7, w.w * 0.58))
  const a = Math.max(0, Math.min(1, w.a))
  const s0 = Math.max(0, r0 - f)
  const s1 = r0
  const s2 = r1
  const s3 = r1 + f
  // Amplify mask opacity so the color read is obvious (still decays with wave alpha).
  const alpha = Math.min(1, a * 2.8)
  return `radial-gradient(circle at ${w.x.toFixed(2)}% ${w.y.toFixed(2)}%, rgba(255,255,255,0) 0px ${s0.toFixed(1)}px, rgba(255,255,255,${alpha.toFixed(3)}) ${s1.toFixed(1)}px ${s2.toFixed(1)}px, rgba(255,255,255,0) ${s3.toFixed(1)}px 2000px)`
}
function ringVis(w: Wave){
  const r0 = Math.max(0, w.r - w.w)
  const r1 = w.r + w.w
  const f = Math.min(20, Math.max(9, w.w * 0.62))
  const a = Math.max(0, Math.min(1, w.a)) * 0.22
  const s0 = Math.max(0, r0 - f)
  const s1 = r0
  const s2 = r1
  const s3 = r1 + f
  return `radial-gradient(circle at ${w.x.toFixed(2)}% ${w.y.toFixed(2)}%, rgba(255,255,255,0) 0px ${s0.toFixed(1)}px, rgba(255,255,255,${a.toFixed(3)}) ${s1.toFixed(1)}px ${s2.toFixed(1)}px, rgba(255,255,255,0) ${s3.toFixed(1)}px 2000px)`
}
function recomputeWaveStyles(){
  if (waves.length === 0){
    waveMask.value = 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0 100%)'
    waveVis.value = 'none'
    colorO.value = 0
    return
  }
  const maxA = waves.reduce((m,w)=>Math.max(m,w.a), 0)
  colorO.value = Math.min(1, maxA * 1.15)
  waveMask.value = waves.map(ringMask).join(',')
  waveVis.value = waves.map(ringVis).join(',')
}


const activeArc = ref(1)

const mediaWrap = ref<HTMLDivElement | null>(null)
const stackEl = ref<HTMLDivElement | null>(null)
const incomingWrap = ref<HTMLDivElement | null>(null)
const baseColorImg = ref<HTMLImageElement | null>(null)
const baseBwImg = ref<HTMLImageElement | null>(null)
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
  diagPx = Math.sqrt(r.width*r.width + r.height*r.height)
  const x = ((e.clientX - r.left) / r.width) * 100
  const y = ((e.clientY - r.top) / r.height) * 100
  thx = Math.max(0, Math.min(100, x))
  thy = Math.max(0, Math.min(100, y))
}

function tickHover(){
  const now = performance.now()
  const dt = lastTick ? Math.min(48, now - lastTick) : 16
  lastTick = now
  const dtS = dt / 1000

  // advance cursor-origin waves (water rings)
  if (waves.length){
    for (const w of waves){
      w.r += w.vr * dtS
      w.a = Math.max(0, w.a - dtS * 0.42)
    }
    // keep a handful of recent rings for performance
    waves = waves.filter(w => w.a > 0.02 && w.r < diagPx * 1.25).slice(-8)
  }
  recomputeWaveStyles()

  // flowy follow (same feel as the About portrait)
  const a = hoverActive.value ? 0.18 : 0.12
  hx.value = hx.value + (thx - hx.value) * a
  hy.value = hy.value + (thy - hy.value) * a

  const near = Math.abs(thx - hx.value) + Math.abs(thy - hy.value) < 0.08
  const keep = !reduce() && (hoverActive.value || waves.length > 0 || !near)

  if (keep){
    hoverRaf = requestAnimationFrame(tickHover)
  } else {
    hoverRaf = null
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

  const now = performance.now()
  const dt = Math.max(16, now - lastMoveT)
  const dx = e.clientX - lastMoveX
  const dy = e.clientY - lastMoveY
  const v = Math.sqrt(dx*dx + dy*dy) / dt // px/ms


  // emit a wave (starts exactly at cursor)
  if (!reduce()){
    const since = now - lastWaveEmit
    const moved = (Math.abs(dx) + Math.abs(dy)) > 0.6
    if (since > 55 && moved){
      lastWaveEmit = now
      // Ensure slow movement still produces a visible ripple + color reveal.
      const amp = Math.max(0.14, Math.min(0.95, 0.20 + v * 1.25))
      const width = Math.max(11, Math.min(46, 12 + v * 46))
      const speed = Math.max(850, Math.min(2000, 850 + v * 4500)) // px/s
      waves.push({ x: thx, y: thy, r: 0, a: amp, w: width, vr: speed })
      if (waves.length > 8) waves = waves.slice(-8)
      recomputeWaveStyles()
    }
  }
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
  if (hoverRaf == null) hoverRaf = requestAnimationFrame(tickHover)
}

const hoverStyle = computed(() => ({
  '--mx': `${hx.value}%`,
  '--my': `${hy.value}%`,
  '--ripO': String(Math.min(0.55, colorO.value * 0.55)),
  '--waveMask': waveMask.value,
  '--waveVis': waveVis.value,
  '--colorO': String(colorO.value)
}))

const imgFxClass = computed(() => {
  if (rippleActive.value) return 'swapRipple'
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

.imgStack{
  position:absolute;
  inset:0;
  --mx: 50%;
  --my: 50%;
  --ripO: 0;
  --colorO: 0;
  --waveMask: radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0 100%);
  --waveVis: none;
  will-change: transform;
}

.media{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  will-change: transform, clip-path, filter, opacity;
  --blur: 0px;
  filter: blur(var(--blur));
}

/* Default: thumbnails appear black & white via base layer; color only shows on ripple wavefronts */
.media.bw{
  filter: grayscale(1) contrast(1.02) blur(var(--blur));
}
.media.color{
  opacity: 1;
  mask-image: var(--waveMask);
  -webkit-mask-image: var(--waveMask);
}
.incoming{ position:absolute; inset:0; }
.media.top{ position:absolute; inset:0; }

/* Swap ripple distortion during project change (applied on the stack so grayscale stays intact) */
.imgStack.swapRipple{ filter: url(#rippleFilter); }


.ripples{
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity: var(--ripO);
  mix-blend-mode: normal;
  background-image: var(--waveVis);
  background-repeat: no-repeat;
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
