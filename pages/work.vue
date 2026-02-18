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
      <div class="k title" data-reveal>( WORK )</div>
      <div class="k dim2" data-reveal>Quick scan for clients. Open a project to see goal, approach, deliverables.</div>

      <div class="toggle" data-reveal>
        <button class="k dim2 tbtn" :data-active="mode==='best' ? '1' : '0'" @click="mode='best'">( BEST 3 )</button>
        <button class="k dim2 tbtn" :data-active="mode==='all' ? '1' : '0'" @click="mode='all'">( ALL )</button>
      </div>

      <div class="grid" data-reveal>
        <NuxtLink v-for="p in shown" :key="p.id" class="card" :to="`/project/${p.id}`">
          <div class="top">
            <div class="k">{{ p.title }}</div>
            <div class="k dim2">{{ p.badge }}</div>
          </div>

          <div class="thumb">
            <img :src="p.media.src" :alt="p.media.alt" loading="lazy" decoding="async" />
            <div class="chip k dim2">( OPEN )</div>
          </div>

          <p class="p">{{ p.desc }}</p>

          <div class="meta">
            <div class="k dim2">{{ p.metaLine }}</div>
            <div class="tags">
              <span v-for="t in p.tags" :key="t" class="k dim2 tag">{{ t }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div class="cta" data-reveal>
        <a v-if="site.hero.links.upwork" class="k dim2 ctaBtn" :href="site.hero.links.upwork" target="_blank" rel="noreferrer">( HIRE ON UPWORK )</a>
        <a class="k dim2 ctaBtn" :href="`mailto:${site.contact.email}`">( EMAIL )</a>
      </div>
    </section>

    <FooterNav
      :current="0"
      :total="projects.length"
      :year="String(new Date().getFullYear())"
      :showBack="true"
      @back="navigateTo('/')"
      @listing="navigateTo('/work')"
      @jump="() => {}"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { site } from '~/content/site'
import { useProjects } from '~/composables/useProjects'

const { projects } = useProjects()
const mode = ref<'best'|'all'>('best')

const best = computed(() => {
  return [...projects]
    .filter(p => typeof p.featuredRank === 'number')
    .sort((a,b) => (a.featuredRank! - b.featuredRank!))
    .slice(0, 3)
})

const shown = computed(() => (mode.value === 'best' ? best.value : projects))
</script>

<style scoped>
.body{ flex:1; padding-top: 6vh; padding-bottom: 6vh; }
.title{ margin-bottom: 10px; }

.toggle{
  margin-top: 14px;
  display:flex;
  gap: 10px;
  flex-wrap:wrap;
}
.tbtn{
  border: 1px solid var(--line);
  padding: 8px 10px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  opacity: .7;
  transition: opacity .18s ease, border-color .18s ease;
}
.tbtn[data-active="1"]{
  opacity: 1;
  border-color: color-mix(in srgb, var(--fg) 26%, var(--bg));
}
.tbtn:hover{ opacity: 1; }

.grid{
  margin-top: 14px;
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.card{
  border: 1px solid var(--line);
  padding: 16px;
  background: color-mix(in srgb, var(--bg) 74%, transparent);
  display:flex;
  flex-direction:column;
  gap: 10px;
  transition: border-color .18s ease, opacity .18s ease;
}
.card:hover{ border-color: color-mix(in srgb, var(--fg) 24%, var(--bg)); opacity: .92; }

.top{ display:flex; justify-content:space-between; gap: 12px; align-items:baseline; }

.thumb{
  position:relative;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  overflow:hidden;
}
.thumb img{ width:100%; height:auto; display:block; filter: grayscale(1) contrast(1.06) brightness(0.98); transition: filter .25s ease; }
.card:hover .thumb img{ filter: grayscale(0.15) contrast(1.02) brightness(1.02); }
.chip{
  position:absolute;
  right: 10px;
  bottom: 10px;
  border: 1px solid var(--line);
  padding: 6px 8px;
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  backdrop-filter: blur(6px);
}

.p{
  margin: 0;
  font-size: calc(var(--fs) * 1.02);
  letter-spacing: 0.01em;
  text-transform: none;
  line-height: 1.65;
  color: color-mix(in srgb, var(--fg) 78%, transparent);
}

.meta{ margin-top: 4px; display:flex; flex-direction:column; gap: 10px; }
.tags{ display:flex; flex-wrap:wrap; gap: 10px; justify-content:flex-end; }
.tag{ border: 1px solid var(--line); padding: 6px 8px; }

.cta{ margin-top: 16px; display:flex; gap: 12px; flex-wrap:wrap; }
.ctaBtn{
  border: 1px solid var(--line);
  padding: 10px 12px;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  transition: opacity .18s ease, border-color .18s ease;
}
.ctaBtn:hover{ opacity: .86; border-color: color-mix(in srgb, var(--fg) 24%, var(--bg)); }

@media (max-width: 1024px){
  .grid{ grid-template-columns: 1fr; }
  .top{ flex-direction: column; align-items:flex-start; }
  .tags{ justify-content:flex-start; }
}

@media (prefers-reduced-motion: reduce){
  .card, .thumb img, .tbtn, .ctaBtn{ transition:none; }
}
</style>
