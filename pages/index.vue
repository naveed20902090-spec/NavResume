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
        <div v-if="listingOpen" class="listing" role="dialog" aria-modal="true">
          <div class="listingInner">
            <div class="k">WORK</div>
            <div class="k dim2" style="margin-top:6px;">( click a project )</div>

            <div class="list">
              <button
                v-for="(p, i) in projects"
                :key="p.id"
                class="row"
                @click="jump(i); listingOpen=false; navigateTo(`/project/${p.id}`)"
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

            <button class="close k" @click="listingOpen=false">( CLOSE )</button>
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

function jump(i:number){ idx.value = i }
function toggleListing(){ listingOpen.value = !listingOpen.value }

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
