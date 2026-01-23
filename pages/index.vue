<template>
  <main class="frame">
    <HeaderNav
      @home="navigateTo('/')"
      @work="toggleListing"
      @services="navigateTo('/services')"
      @about="navigateTo('/about')"
      @contact="navigateTo('/contact')"
    />

    <div class="heroLine" data-reveal>
      <div class="k dim2">{{ site.hero.kicker }}</div>
      <div class="k">{{ site.hero.headline }}</div>
    </div>

    <ProjectStage v-model="idx" :projects="projects" />

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

            <div class="list">
              <button
                v-for="(p, i) in projects"
                :key="p.id"
                class="row"
                @click="selectProject(i, p.id)"
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
const year = String(new Date().getFullYear())

const listingEl = ref<HTMLElement | null>(null)
const listingInner = ref<HTMLElement | null>(null)

const lastActiveEl = ref<HTMLElement | null>(null)
const restoreFocus = ref(true)

function jump(i:number){ idx.value = i }

function openListing(){
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
  else openListing()
}

function selectProject(i:number, id:string){
  restoreFocus.value = false
  jump(i)
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
      } else {
        if (!inside || active === last) {
          e.preventDefault()
          first.focus()
        }
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
  if (reduce()){
    gsap.set(el, { opacity: 1 })
    done();
    return
  }
  const inner = (el as HTMLElement).querySelector('.listingInner')
  const rows = (el as HTMLElement).querySelectorAll('.row')

  gsap.set(el, { opacity: 0 })
  gsap.set(inner, { y: 18, opacity: 0, scale: 0.99 })

  const tl = gsap.timeline({ onComplete: done, defaults: { ease: 'power3.out' } })
  tl.to(el, { opacity: 1, duration: 0.18 }, 0)
    .to(inner, { y: 0, opacity: 1, scale: 1, duration: 0.38 }, 0.06)
    .fromTo(rows, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, stagger: 0.04 }, 0.14)
}

function leaveListing(el: Element, done: () => void){
  if (reduce()){
    done();
    return
  }
  const inner = (el as HTMLElement).querySelector('.listingInner')
  const tl = gsap.timeline({ onComplete: done, defaults: { ease: 'power3.inOut' } })
  tl.to(inner, { y: 10, opacity: 0, scale: 0.99, duration: 0.22 }, 0)
    .to(el, { opacity: 0, duration: 0.22 }, 0)
}
</script>

<style scoped>
.heroLine{
  margin-top: 14px;
  display:flex;
  justify-content:space-between;
  gap: 18px;
  align-items:baseline;
}
@media (max-width:768px){
  .heroLine{ flex-direction:column; align-items:flex-start; gap:6px; }
}

.listing{
  position:fixed;
  inset:0;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(8px);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index: 9997;
}
.listingInner{
  width:min(720px, 92vw);
  border: 1px solid var(--line);
  background: var(--bg);
  padding: 22px;
}
.list{
  margin-top: 16px;
  display:flex;
  flex-direction:column;
  gap: 8px;
}
.row{
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  padding: 10px 12px;
  border: 1px solid var(--line);
  transition: border-color .18s ease, opacity .18s ease;
}
.row:hover{ border-color: color-mix(in srgb, var(--fg) 24%, var(--bg)); opacity: .78; }
.actions{
  margin-top: 14px;
  display:flex;
  gap: 14px;
  flex-wrap:wrap;
}
.close{ margin-top: 18px; }

@media (prefers-reduced-motion: reduce){
  .row{ transition:none; }
}
</style>
