<template>
  <main class="frame">
    
    <HeaderNav
      @home="navigateTo('/')"
      @work="navigateTo('/')"
      @services="navigateTo('/services')"
      @about="navigateTo('/about')"
      @contact="navigateTo('/contact')"
    />

    <section class="body">
      <div class="k title" data-reveal>( SERVICES )</div>

      <!-- Museum-plaques (quick scan) -->
      <div class="plaqueGrid" data-reveal>
        <div v-for="p in site.services.plaques" :key="p" class="plaque">
          <div class="k">{{ p }}</div>
        </div>
      </div>

      <div class="grid">
        <div v-for="it in site.services.items" :key="it.title" class="card">
          <div class="k">{{ it.title }}</div>
          <p class="p">{{ it.desc }}</p>
          <ul class="ul">
            <li v-for="b in it.bullets" :key="b" class="p">{{ b }}</li>
          </ul>
        </div>
      </div>

      <div class="grid2">
        <div class="card">
          <div class="k">DELIVERABLES</div>
          <ul class="ul">
            <li v-for="d in site.services.deliverables" :key="d" class="p">{{ d }}</li>
          </ul>
        </div>
        <div class="card">
          <div class="k">WHAT I NEED FROM YOU</div>
          <ul class="ul">
            <li v-for="r in site.services.requirements" :key="r" class="p">{{ r }}</li>
          </ul>
        </div>
      </div>

      <div class="cta" data-reveal>
        <a v-if="site.hero.links.upwork" class="k dim2" :href="site.hero.links.upwork" target="_blank" rel="noreferrer">( HIRE ON UPWORK )</a>
        <a class="k dim2" :href="`mailto:${site.contact.email}`">( REQUEST A QUOTE )</a>
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
import { computed } from 'vue'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { site } from '~/content/site'
import { projects } from '~/composables/useProjects'

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const triggers: any[] = []

const total = computed(() => projects.length)

onMounted(() => {
  if (!process.client || reduce()) return
  const cards = gsap.utils.toArray<HTMLElement>('.card')
  cards.forEach((card) => {
    const tween = gsap.from(card, { opacity: 0, y: 18, duration: 0.65, ease: 'power3.out', paused: true })
    const st = ScrollTrigger.create({
      trigger: card,
      start: 'top 88%',
      once: true,
      onEnter: () => tween.play()
    })
    triggers.push(st)
  })
})

onBeforeUnmount(() => {
  triggers.forEach(t => t.kill())
})
</script>

<style scoped>
.body{ flex:1; padding-top: 6vh; padding-bottom: 6vh; }
.title{ margin-bottom: 14px; }

.plaqueGrid{
  display:grid;
  /* 4 plaques should read as a single row on desktop (no "empty" slots) */
  grid-template-columns: repeat(4, minmax(0,1fr));
  gap: 14px;
  margin-bottom: 14px;
}
.plaque{
  border: 1px solid var(--line);
  padding: 14px 16px;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
}
.grid{
  display:grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 14px;
}
.grid2{
  margin-top: 14px;
  display:grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 14px;
}
.card{
  border: 1px solid var(--line);
  padding: 16px;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
}
.p{
  margin: 10px 0 0;
  font-size: var(--fs);
  letter-spacing: 0.02em;
  text-transform: none;
  line-height: 1.6;
  color: color-mix(in srgb, var(--fg) 72%, transparent);
}
.ul{ margin:10px 0 0; padding-left: 16px; }
.cta{ margin-top: 14px; display:flex; flex-wrap:wrap; gap: 14px; }
@media (max-width: 1024px){
  .grid{ grid-template-columns: 1fr; }
  .grid2{ grid-template-columns: 1fr; }
  .plaqueGrid{ grid-template-columns: repeat(2, minmax(0,1fr)); }
}

@media (max-width: 640px){
  .plaqueGrid{ grid-template-columns: 1fr; }
}
</style>
