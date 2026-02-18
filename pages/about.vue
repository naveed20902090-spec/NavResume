<template>
  <main class="frame">
    <HeaderNav
      @home="navigateTo('/')"
      @work="navigateTo('/work')"
      @services="navigateTo('/services')"
      @about="navigateTo('/about')"
      @contact="navigateTo('/contact')"
    />

    <section class="body">
      <div class="k dim2" data-reveal>{{ site.about.kicker }}</div>
      <div class="k title" data-reveal>( ABOUT )</div>

      <div class="museum">
        <div class="leftCol">
          <div class="panel lead" data-reveal>
            <div class="k">{{ site.about.headline }}</div>
            <p class="p">{{ site.about.body }}</p>
            <div class="k dim2 metaLine">{{ site.location }}</div>
          </div>

          <div class="split">
            <div class="panel" data-reveal>
              <div class="k">STRENGTHS</div>
              <ul class="ul">
                <li v-for="s in site.about.strengths" :key="s" class="p li">{{ s }}</li>
              </ul>
            </div>

            <div class="panel" data-reveal>
              <div class="k">WORKFLOW</div>
              <ul class="ul">
                <li v-for="w in site.about.workflow" :key="w" class="p li">{{ w }}</li>
              </ul>
            </div>
          </div>
        </div>

        <aside class="rightCol">
          <figure class="portrait" data-reveal>
            <div class="mat">
              <div
                ref="portraitStage"
                class="photoStage"
                :data-active="portraitActive ? '1' : '0'"
                :style="portraitStyle"
                @pointerenter="onPortraitEnter"
                @pointermove="onPortraitMove"
                @pointerleave="onPortraitLeave"
              >
                <img class="photo photoColor" src="/profile.jpg" alt="Tauseef Rahman portrait" loading="lazy" decoding="async" />
                <img class="photo photoBW" src="/profile.jpg" alt="" aria-hidden="true" loading="lazy" decoding="async" />
                <div class="halo" aria-hidden="true"></div>
              </div>
            </div>
            <figcaption class="k dim2 cap">
              {{ site.displayName.toUpperCase() }} • {{ site.handle.toUpperCase() }} • {{ site.location.toUpperCase() }}
            </figcaption>
          </figure>

          <div class="cta" data-reveal>
            <a class="k dim2" :href="`mailto:${site.contact.email}`">( HIRE VIA EMAIL )</a>
            <a class="k dim2" :href="site.hero.links.youtube" target="_blank" rel="noreferrer">( YOUTUBE )</a>
            <a class="k dim2" :href="site.hero.links.instagram" target="_blank" rel="noreferrer">( INSTAGRAM )</a>
          </div>
        </aside>
      </div>
    </section>

    <FooterNav
      :current="0"
      :total="total"
      :year="String(new Date().getFullYear())"
      :showBack="true"
      @back="navigateTo('/')"
      @listing="navigateTo('/')"
      @jump="() => {}"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { site } from '~/content/site'
import { projects } from '~/composables/useProjects'

const total = computed(() => projects.length)

// Portrait: grayscale base with localized color reveal on hover
// Make the mask motion "flowy" by lerping toward the pointer.
const portraitStage = ref<HTMLElement | null>(null)
const portraitActive = ref(false)
const mx = ref(50)
const my = ref(50)

let raf: number | null = null
let tx = 50
let ty = 50

function setTargetFromEvent(e: PointerEvent) {
  const el = portraitStage.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * 100
  const y = ((e.clientY - r.top) / r.height) * 100
  tx = Math.max(0, Math.min(100, x))
  ty = Math.max(0, Math.min(100, y))
}

function tick(){
  raf = null
  // easing factor: higher = snappier
  const a = portraitActive.value ? 0.18 : 0.12
  mx.value = mx.value + (tx - mx.value) * a
  my.value = my.value + (ty - my.value) * a

  const near = Math.abs(tx - mx.value) + Math.abs(ty - my.value) < 0.08
  if (portraitActive.value || !near) {
    raf = requestAnimationFrame(tick)
  }
}

function onPortraitEnter(e: PointerEvent) {
  portraitActive.value = true
  setTargetFromEvent(e)
  if (raf == null) raf = requestAnimationFrame(tick)
}

function onPortraitMove(e: PointerEvent) {
  if (!portraitActive.value) return
  setTargetFromEvent(e)
}

function onPortraitLeave() {
  portraitActive.value = false
}

onBeforeUnmount(() => {
  if (raf != null) cancelAnimationFrame(raf)
})

const portraitStyle = computed(() => ({
  '--mx': `${mx.value}%`,
  '--my': `${my.value}%`,
}))

</script>


<style scoped>
.body{
  flex:1;
  padding-top: 6vh;
  padding-bottom: 6vh;
}
.title{
  margin-top: 10px;
  margin-bottom: 22px;
}
.museum{
  display:grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: clamp(18px, 3.2vw, 36px);
  align-items:start;
}

.panel{
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 75%, transparent);
  padding: 18px;
}
.lead{
  padding: 22px;
}
.metaLine{
  margin-top: 14px;
}

.split{
  margin-top: 14px;
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.p{
  margin: 10px 0 0;
  font-size: calc(var(--fs) * 1.02);
  letter-spacing: 0.01em;
  text-transform: none;
  line-height: 1.65;
  color: color-mix(in srgb, var(--fg) 78%, transparent);
}
.li{ margin-top: 8px; }
.ul{ margin:10px 0 0; padding-left: 16px; }

.rightCol{
  position:relative;
}
.portrait{
  margin: 0;
}
.mat{
  border: 1px solid var(--line);
  padding: 14px;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  position: sticky;
  top: 88px;
}
@property --revealR{
  syntax: "<length>";
  inherits: true;
  initial-value: 0px;
}
@property --haloR{
  syntax: "<length>";
  inherits: true;
  initial-value: 0px;
}

.photoStage{
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 10px;
  --mx: 50%;
  --my: 50%;
  --revealR: 0px;
  --haloR: 0px;
  transition: --revealR .26s ease, --haloR .26s ease;
}
.photoStage[data-active="1"]{
  --revealR: 132px;
  --haloR: 178px;
}
.photo{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photoBW{
  filter: grayscale(1) contrast(1.05) brightness(0.98);
  -webkit-mask-image: radial-gradient(circle var(--revealR) at var(--mx) var(--my),
    rgba(0,0,0,0) 0%,
    rgba(0,0,0,0) 54%,
    rgba(0,0,0,0.55) 72%,
    rgba(0,0,0,1) 86%,
    rgba(0,0,0,1) 100%);
  mask-image: radial-gradient(circle var(--revealR) at var(--mx) var(--my),
    rgba(0,0,0,0) 0%,
    rgba(0,0,0,0) 54%,
    rgba(0,0,0,0.55) 72%,
    rgba(0,0,0,1) 86%,
    rgba(0,0,0,1) 100%);
}

.halo{
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity .16s ease;
  background: radial-gradient(circle var(--haloR) at var(--mx) var(--my),
    color-mix(in srgb, var(--fg) 34%, transparent) 0%,
    color-mix(in srgb, var(--fg) 18%, transparent) 32%,
    transparent 64%);
  mix-blend-mode: screen;
}
.photoStage[data-active="1"] .halo{ opacity: 1; }

@media (prefers-reduced-motion: reduce){
  .photoStage{ transition: none; }
  .halo{ transition: none; }
}

@media (hover: none), (pointer: coarse){
  .photoBW{ -webkit-mask-image: none; mask-image: none; }
  .halo{ display: none; }
}

.cap{
  margin-top: 12px;
  line-height: 1.4;
  text-align:left;
  opacity: .7;
}

.cta{
  margin-top: 16px;
  display:flex;
  flex-direction:column;
  gap: 10px;
}
.cta a{
  width: fit-content;
}

@media (max-width: 920px){
  .museum{ grid-template-columns: 1fr; }
  .split{ grid-template-columns: 1fr; }
  .rightCol{ max-width: 520px; }
}
</style>
