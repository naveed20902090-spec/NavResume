<template>
  <main class="frame homeFrame">
    <HeaderNav
      @home="navigateTo('/')"
      @work="navigateTo('/work')"
      @services="navigateTo('/services')"
      @about="navigateTo('/about')"
      @contact="navigateTo('/contact')"
    />

    <ProjectStage v-model="idx" :projects="projects" />

    <div class="luxDivider heroDivider" data-line />

    <section class="hero heroFocused" aria-label="Intro" data-reveal>
      <div class="heroAmbient" aria-hidden="true">
        <span class="glow glowA"></span>
        <span class="glow glowB"></span>
      </div>

      <div class="heroIntro">
        <div class="k dim2 heroKicker">{{ site.hero.kicker }}</div>

        <div class="heroBadgeRow" aria-label="Positioning">
          <span class="k dim2 heroBadge">AVAILABLE FOR FREELANCE + RETAINERS</span>
          <span class="k dim2 heroBadge">BASED IN {{ site.location.toUpperCase() }}</span>
        </div>

        <h1 class="heroTitle title">{{ site.hero.headline }}</h1>
        <ScrambledText
          class="heroDesc heroScramble"
          :text="site.hero.sub"
          :radius="40"
          :duration="1"
          :speed="1"
          scramble-chars="xX"
        />

        <div class="pillRow" aria-label="Services">
          <span v-for="pill in site.hero.pills" :key="pill" class="k dim2 pill">{{ pill }}</span>
        </div>

        <div class="heroActions" aria-label="Primary actions">
          <button class="heroBtn primary" type="button" @click="openListing('all')">
            <span class="k">VIEW WORK</span>
            <span class="arrow" aria-hidden="true">→</span>
          </button>

          <button class="heroBtn" type="button" @click="navigateTo('/contact')">
            <span class="k">GET IN TOUCH</span>
          </button>
        </div>
      </div>

      <div class="heroProofRow" aria-label="Proof points">
        <div v-for="stat in heroStats" :key="stat.label" class="heroStat">
          <div class="k dim2">{{ stat.label }}</div>
          <div class="k">{{ stat.value }}</div>
        </div>
      </div>
    </section>

    <FooterNav
      :current="idx"
      :total="projects.length"
      :year="year"
      :showBack="false"
      @back="navigateTo('/about')"
      @listing="toggleListing"
      @jump="jump"
    />

    <Teleport to="body">
      <Transition :css="false" @enter="enterListing" @leave="leaveListing">
        <div v-if="listingOpen" class="listing" role="dialog" aria-modal="true" aria-labelledby="listingTitle" ref="listingEl" @pointerdown.self="closeListing">
          <div class="listingInner" ref="listingInner" tabindex="-1">
            <div class="k" id="listingTitle">WORK</div>
            <div class="k dim2" style="margin-top:6px;">( click a project )</div>
            <div class="luxDivider" data-line style="margin-top:14px;" />

            <div class="listMode">
              <button class="k dim2 mode" :data-active="listingMode==='best' ? '1' : '0'" @click="listingMode='best'">( BEST )</button>
              <button class="k dim2 mode" :data-active="listingMode==='all' ? '1' : '0'" @click="listingMode='all'">( ALL )</button>
            </div>

            <div class="list">
              <button
                v-for="(p, i) in listingProjects"
                :key="p.id"
                class="row"
                @click="selectProjectFromList(i, p.id)"
              >
                <span class="k">{{ p.title }}</span>
                <span class="k dim2">{{ p.badge }}</span>
              </button>
            </div>

            <div class="actions">
              <a class="k dim2" :href="`mailto:${site.contact.email}`">( EMAIL )</a>
              <a class="k dim2" :href="site.hero.links.youtube" target="_blank" rel="noreferrer">( YOUTUBE )</a>
              <a class="k dim2" :href="site.hero.links.instagram" target="_blank" rel="noreferrer">( INSTAGRAM )</a>
            </div>

            <button class="close k" @click="closeListing">( CLOSE )</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { useProjects } from '~/composables/useProjects'
import { site } from '~/content/site'

const { projects } = useProjects()
const idx = ref(0)
const listingOpen = ref(false)
const listingMode = ref<'all'|'best'>('all')
const year = String(new Date().getFullYear())

const heroStats = computed(() => [
  { label: 'SELECTED WORK', value: `${String(projects.length).padStart(2, '0')} PROJECTS` },
  { label: 'FOCUS', value: 'CINEMATIC + RETENTION' },
  { label: 'DELIVERY', value: 'REMOTE • FAST REPLIES' }
])

const listingEl = ref<HTMLElement | null>(null)
const listingInner = ref<HTMLElement | null>(null)
const lastActiveEl = ref<HTMLElement | null>(null)
const restoreFocus = ref(true)

function jump(i: number){ idx.value = i }

function openListing(mode: 'all'|'best' = 'all'){
  listingMode.value = mode
  if (process.client) {
    restoreFocus.value = true
    lastActiveEl.value = document.activeElement as HTMLElement | null
  }
  listingOpen.value = true
}

function closeListing(){
  listingOpen.value = false
}

function toggleListing(){
  if (listingOpen.value) closeListing()
  else openListing('all')
}

const listingProjects = computed(() => {
  const best = [...projects]
    .filter(p => typeof p.featuredRank === 'number')
    .sort((a, b) => (a.featuredRank! - b.featuredRank!))
  return listingMode.value === 'best' ? best : projects
})

function selectProjectFromList(i: number, id: string){
  restoreFocus.value = false
  const fullIndex = projects.findIndex(p => p.id === id)
  if (fullIndex >= 0) jump(fullIndex)
  closeListing()
  navigateTo(`/project/${id}`)
}

const focusableSel = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
function getFocusables(){
  const root = listingInner.value
  if (!process.client || !root) return []
  return Array.from(root.querySelectorAll<HTMLElement>(focusableSel))
    .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1)
}

let keyHandler: ((e: KeyboardEvent) => void) | null = null

watch(listingOpen, async (open) => {
  if (!process.client) return

  if (open) {
    document.body.style.overflow = 'hidden'
    await nextTick()

    const focusables = getFocusables()
    ;(focusables[0] ?? listingInner.value)?.focus?.()

    keyHandler = (e: KeyboardEvent) => {
      if (!listingOpen.value) return

      if (e.key === 'Escape') {
        e.preventDefault()
        closeListing()
        return
      }

      if (e.key !== 'Tab') return

      const els = getFocusables()
      if (!els.length) {
        e.preventDefault()
        listingInner.value?.focus?.()
        return
      }

      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement as HTMLElement | null
      const inside = !!(active && listingInner.value?.contains(active))

      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (!inside || active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', keyHandler)
  } else {
    document.body.style.overflow = ''
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler)
      keyHandler = null
    }

    await nextTick()
    if (restoreFocus.value) {
      const el = lastActiveEl.value
      if (el && document.contains(el)) {
        try { el.focus() } catch {}
      }
    }
  }
})

onBeforeUnmount(() => {
  if (!process.client) return
  document.body.style.overflow = ''
  if (keyHandler) document.removeEventListener('keydown', keyHandler)
})

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function enterListing(el: Element, done: () => void){
  if (reduce()) {
    gsap.set(el, { opacity: 1 })
    done()
    return
  }
  const inner = (el as HTMLElement).querySelector('.listingInner')
  const rows = (el as HTMLElement).querySelectorAll('.row')

  gsap.set(el, { opacity: 0 })
  gsap.set(inner, { y: 18, opacity: 0, scale: 0.99 })
  gsap.set(inner as any, { '--edgeClip': 100 })

  const tl = gsap.timeline({ onComplete: done, defaults: { ease: 'power3.out' } })
  tl.to(el, { opacity: 1, duration: 0.22 }, 0)
    .to(inner, { y: 0, opacity: 1, scale: 1, duration: 0.52 }, 0.08)

  const innerEl = inner as HTMLElement
  tl.fromTo(innerEl, { clipPath: 'inset(0 0 12% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.62, ease: 'power3.out', clearProps: 'clip-path' }, 0.10)
    .to(innerEl as any, { '--edgeClip': 0, duration: 0.62, ease: 'power3.out' }, 0.10)
    .fromTo(rows, { y: 10, opacity: 0, filter: 'blur(2px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.38, stagger: 0.045, clearProps: 'filter' }, 0.20)
}

function leaveListing(el: Element, done: () => void){
  if (reduce()) {
    done()
    return
  }
  const inner = (el as HTMLElement).querySelector('.listingInner')
  const tl = gsap.timeline({ onComplete: done, defaults: { ease: 'power3.inOut' } })
  tl.to(inner, { y: 14, opacity: 0, scale: 0.99, duration: 0.30, filter: 'blur(2px)', clearProps: 'filter' }, 0)
    .to(el, { opacity: 0, duration: 0.26 }, 0.02)
}
</script>

<style scoped>
.homeFrame {
  gap: 0;
}

.hero {
  position: relative;
  margin: 0 auto 0;
  width: min(960px, 100%);
  padding: 26px 28px 24px;
  border: 1px solid color-mix(in srgb, var(--fg) 10%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--fg) 4%, transparent), color-mix(in srgb, var(--bg) 96%, transparent));
  overflow: hidden;
  isolation: isolate;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--fg) 4%, transparent) inset,
    0 28px 90px color-mix(in srgb, var(--fg) 4%, transparent);
}

.heroAmbient {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(36px);
  opacity: .4;
}

.glowA {
  width: 320px;
  height: 320px;
  top: -120px;
  left: -20px;
  background: color-mix(in srgb, var(--fg) 8%, transparent);
}

.glowB {
  width: 280px;
  height: 280px;
  right: -60px;
  bottom: -150px;
  background: color-mix(in srgb, var(--fg) 6%, transparent);
}

.heroFocused {
  display: grid;
  gap: 22px;
}

.heroIntro {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
}

.heroKicker {
  opacity: .78;
}

.heroBadgeRow {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.heroBadge {
  border: 1px solid color-mix(in srgb, var(--fg) 12%, transparent);
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  padding: 8px 12px;
}

.heroTitle {
  margin: 18px auto 0;
  font: inherit;
  text-transform: none;
  letter-spacing: 0;
  line-height: .96;
  font-weight: 600;
  font-size: clamp(44px, 6vw, 88px);
  color: var(--fg);
  max-width: 11ch;
}

.heroDesc {
  margin: 16px auto 0;
  max-width: 62ch;
  font-size: calc(var(--fs) * 1.02);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.7;
  color: color-mix(in srgb, var(--fg) 78%, transparent);
}

.heroScramble :deep(.scrambledTextLine) {
  margin: 0;
}

.heroScramble :deep(.char) {
  min-width: 0.32ch;
}

.pillRow {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.pill {
  border: 1px solid var(--line);
  padding: 10px 14px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
}

.heroActions {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px;
}

.heroBtn {
  border: 1px solid var(--line);
  padding: 16px 22px;
  min-width: 220px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--fg) 3.5%, transparent), color-mix(in srgb, var(--bg) 92%, transparent));
  backdrop-filter: blur(10px);
  transition: opacity .18s ease, border-color .18s ease, transform .14s ease;
}

.heroBtn.primary {
  border-color: color-mix(in srgb, var(--fg) 24%, var(--bg));
}

.heroBtn:hover {
  opacity: .86;
  border-color: color-mix(in srgb, var(--fg) 24%, var(--bg));
}

.heroBtn:active {
  transform: scale(0.985);
}

.arrow {
  font-size: 1.05em;
  opacity: .85;
}

.heroProofRow {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.heroStat {
  border-top: 1px solid color-mix(in srgb, var(--fg) 10%, transparent);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.heroDivider {
  margin-top: 16px;
}

.listMode {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.mode {
  border: 1px solid var(--line);
  padding: 8px 10px;
  background: color-mix(in srgb, var(--bg) 90%, transparent);
  opacity: .7;
  transition: opacity .18s ease, border-color .18s ease;
}

.mode[data-active="1"] {
  opacity: 1;
  border-color: color-mix(in srgb, var(--fg) 26%, var(--bg));
}

.mode:hover {
  opacity: 1;
}

.listing {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9997;
}

.listingInner {
  width: min(720px, 92vw);
  border: 1px solid var(--line);
  background: var(--bg);
  padding: 22px;
  position: relative;
  overflow: hidden;
}

.listingInner::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
  opacity: .55;
  pointer-events: none;
  clip-path: inset(0 0 calc(var(--edgeClip, 100) * 1%) 0);
}

.list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10px 12px;
  border: 1px solid var(--line);
  transition: border-color .18s ease, opacity .18s ease;
}

.row:hover {
  border-color: color-mix(in srgb, var(--fg) 24%, var(--bg));
  opacity: .78;
}

.actions {
  margin-top: 14px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.close {
  margin-top: 18px;
}

@media (prefers-reduced-motion: reduce) {
  .row {
    transition: none;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 22px 18px 20px;
  }

  .heroProofRow {
    grid-template-columns: 1fr;
  }

  .heroTitle {
    font-size: clamp(34px, 9vw, 64px);
    max-width: none;
  }

  .heroBtn {
    min-width: 0;
    width: 100%;
    justify-content: space-between;
  }
}
</style>
