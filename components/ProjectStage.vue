<template>
  <section class="stage" data-reveal>
    <ArcNav side="left" :activeArc="activeArc" :label="prevLabel" @activate="prev" />

    <div class="center">
      <div class="mediaWrap" ref="mediaWrap">
        <NuxtLink class="mediaLink" :to="`/project/${current.id}`" aria-label="Open project" data-cursor>
          <img class="media base" :class="{ ripple: rippleActive }" :src="currentSrc" :alt="currentAlt" ref="baseImg" loading="eager" decoding="async" fetchpriority="high" />
          <img v-if="transitioning" class="media top" :class="{ ripple: rippleActive }" :src="incomingSrc" :alt="incomingAlt" ref="topImg" loading="eager" decoding="async" />
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

// Ripple distortion during project media swap.
const rippleActive = ref(false)
const turb = ref<SVGFETurbulenceElement | null>(null)
const disp = ref<SVGFEDisplacementMapElement | null>(null)
let rippleRaf: number | null = null

const activeArc = ref(1)

const baseImg = ref<HTMLImageElement | null>(null)
const topImg = ref<HTMLImageElement | null>(null)
const mediaWrap = ref<HTMLDivElement | null>(null)
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

  const base = baseImg.value
  const wrap = mediaWrap.value
  if (!base || !wrap) return

  incomingSrc.value = src
  incomingAlt.value = alt
  transitioning.value = true

  nextTick(() => {
    const top = topImg.value
    if (!top) {
      transitioning.value = false
      currentSrc.value = src
      currentAlt.value = alt
      return
    }

    gsap.killTweensOf([base, top, wrap])

    // Subtle water-ripple distortion during the swap.
    runRipple(1050)

    gsap.set(top, { clipPath: 'inset(0 0 0 100%)', '--blur': '2px', scale: 1.02 })
    gsap.set(base, { '--blur': '0px', scale: 1 })

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        currentSrc.value = src
        currentAlt.value = alt
        transitioning.value = false
        gsap.set(base, { '--blur': '0px', scale: 1 })
      }
    })

    tl.to(wrap, { duration: 0.22, scale: 0.992 }, 0)
      .to(base, { duration: 0.22, '--blur': '1.5px', scale: 1.01, opacity: 0.7 }, 0)
      .to(top, { duration: 0.46, clipPath: 'inset(0 0 0 0)', '--blur': '0px', scale: 1, opacity: 1 }, 0.06)
      .to(wrap, { duration: 0.48, scale: 1 }, 0.10)
      .to(base, { duration: 0.48, '--blur': '0px', opacity: 1, scale: 1 }, 0.10)
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

onMounted(() => {
  if (!process.client || reduce() || !mediaWrap.value) return
  const wrap = mediaWrap.value
  const base = baseImg.value
  if (!base) return
  const move = (e: MouseEvent) => {
    const r = wrap.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height
    const x = dx * 10
    const y = dy * 6
    gsap.to(base, { x, y, duration: 0.35, ease: 'power3.out' })
    if (topImg.value) gsap.to(topImg.value, { x, y, duration: 0.35, ease: 'power3.out' })
  }
  const leave = () => {
    gsap.to([base, topImg.value].filter(Boolean) as any, { x: 0, y: 0, duration: 0.5, ease: 'power3.out' })
  }

  wrap.addEventListener('mousemove', move, { passive: true })
  wrap.addEventListener('mouseleave', leave)

  onBeforeUnmount(() => {
    wrap.removeEventListener('mousemove', move)
    wrap.removeEventListener('mouseleave', leave)
  })
})

onBeforeUnmount(() => {
  if (rippleRaf) cancelAnimationFrame(rippleRaf)
  rippleRaf = null
  rippleActive.value = false
  try{ disp.value?.setAttribute('scale', '0') } catch { /* ignore */ }
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
.media{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  will-change: transform, clip-path, filter, opacity;
  --blur: 0px;
  filter: blur(var(--blur));
}

/* Water-ripple distortion during project change */
.media.ripple{
  filter: url(#rippleFilter) blur(var(--blur));
}
.media.top{
  position:absolute;
  inset:0;
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
