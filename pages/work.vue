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
      <!-- Header -->
      <div class="head" data-reveal>
        <div class="headCopy">
          <div class="k dim2 headKicker">SELECTED EDITS • CASE-STUDY ENERGY</div>
          <div class="k title h1">Work</div>
          <div class="k dim">{{ shown.length }} {{ mode==='best' ? 'featured' : 'total' }} projects</div>
          <p class="k dim lead">A tighter view of montage work, architectural films, and retention-focused edits built to feel premium before a client even presses play.</p>
        </div>

        <div class="toggle" data-reveal>
          <button class="k dim2 tbtn" :data-active="mode==='best' ? '1' : '0'" @click="mode='best'">( BEST 3 )</button>
          <button class="k dim2 tbtn" :data-active="mode==='all' ? '1' : '0'" @click="mode='all'">( ALL )</button>
        </div>
      </div>

      <div class="luxDivider" data-line />

      <!-- Grid -->
      <div class="grid" data-reveal>
        <NuxtLink
          v-for="p in shown"
          :key="p.id"
          class="card luxSpot"
          :class="{ featured: p.featuredRank === 1, premium: typeof p.featuredRank === 'number' }"
          :to="`/project/${p.id}`"
          @mousemove="onSpot"
          @mouseleave="offSpot"
        >
          <div class="thumb">
            <img :src="p.media.src" :alt="p.media.alt" loading="lazy" decoding="async" />
            <div class="thumbShade"></div>
            <div v-if="typeof p.featuredRank === 'number'" class="best k">Best #{{ p.featuredRank }}</div>
            <div class="open k dim2">( OPEN )</div>
          </div>

          <div class="content">
            <div class="top">
              <div class="k">{{ p.title }}</div>
              <div class="k dim2">{{ p.badge }}</div>
            </div>

            <p class="p">{{ p.desc }}</p>

            <div class="meta">
              <div class="k dim2">{{ p.metaLine }}</div>
              <div class="tags">
                <span v-for="t in p.tags" :key="t" class="k dim2 tag">{{ t }}</span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- CTA -->
      <div class="plaque luxSpot cta" data-reveal @mousemove="onSpot" @mouseleave="offSpot">
        <div class="k title" style="font-size:24px;">Have a project in mind?</div>
        <p class="k dim" style="max-width: 520px; margin: 10px auto 0; line-height: 1.6; text-transform:none; letter-spacing:0.01em;">
          Let’s turn your raw footage into something cinematic.
        </p>
        <div class="ctaRow">
          <a class="k ctaBtn" :href="`mailto:${site.contact.email}`">Get in touch</a>
          <a v-if="site.hero.links.upwork" class="k dim link" :href="site.hero.links.upwork" target="_blank" rel="noreferrer">Upwork</a>
        </div>
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
const mode = ref<'best'|'all'>('all')

const best = computed(() => {
  return [...projects]
    .filter(p => typeof p.featuredRank === 'number')
    .sort((a,b) => (a.featuredRank! - b.featuredRank!))
    .slice(0, 3)
})

const shown = computed(() => (mode.value === 'best' ? best.value : projects))

function onSpot(e: MouseEvent){
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const r = el.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * 100
  const y = ((e.clientY - r.top) / r.height) * 100
  el.style.setProperty('--mx', `${x}%`)
  el.style.setProperty('--my', `${y}%`)
}

function offSpot(e: MouseEvent){
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  el.style.setProperty('--mx', '50%')
  el.style.setProperty('--my', '50%')
}
</script>

<style scoped>
.body{ flex:1; padding-top: 6vh; padding-bottom: 6vh; }

.head{ display:flex; justify-content:space-between; align-items:flex-end; gap: 18px; flex-wrap:wrap; margin-bottom: 18px; }
.headCopy{ max-width: 760px; }
.headKicker{ margin-bottom: 10px; }
.h1{ font-size: 32px; margin-bottom: 8px; }
.lead{ margin-top: 14px; max-width: 62ch; line-height: 1.7; text-transform:none; letter-spacing: 0.01em; }

.toggle{ display:flex; gap: 10px; flex-wrap:wrap; }
.tbtn{
  border: 1px solid var(--line);
  padding: 10px 12px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  opacity: .7;
  transition: opacity .18s ease, border-color .18s ease;
}
.tbtn[data-active="1"]{ opacity: 1; border-color: color-mix(in srgb, var(--fg) 26%, var(--bg)); }
.tbtn:hover{ opacity: 1; }

.grid{ margin-top: 22px; display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.card{ border: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 74%, transparent); overflow:hidden; transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease; }
.card:hover{ transform: translateY(-4px); border-color: color-mix(in srgb, var(--fg) 18%, var(--bg)); }
.card.featured{ grid-column: span 2; }
.card.premium{ box-shadow: 0 0 0 1px color-mix(in srgb, var(--fg) 4%, transparent) inset, 0 16px 48px color-mix(in srgb, var(--fg) 4%, transparent); }

.thumb{ position:relative; aspect-ratio: 16/9; border-bottom: 1px solid var(--line); overflow:hidden; }
.thumb img{ width:100%; height:100%; object-fit:cover; display:block; filter: grayscale(1) contrast(1.06) brightness(0.98); transition: filter .25s ease; }
.card:hover .thumb img{ filter: grayscale(0.15) contrast(1.02) brightness(1.02); }
.thumbShade{ position:absolute; inset:0; background: linear-gradient(180deg, rgba(0,0,0,.08), transparent 34%, rgba(0,0,0,.42)); pointer-events:none; }
.best{ position:absolute; top: 10px; left: 10px; padding: 6px 10px; border: 1px solid var(--strokeHi); background: var(--bg); font-size: 11px; }
.open{ position:absolute; right: 10px; bottom: 10px; padding: 6px 10px; border: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 78%, transparent); backdrop-filter: blur(6px); }

.content{ padding: 16px; display:flex; flex-direction:column; gap: 10px; }
.top{ display:flex; justify-content:space-between; gap: 12px; align-items:baseline; }
.p{ margin: 0; font-size: calc(var(--fs) * 1.02); letter-spacing: 0.01em; text-transform: none; line-height: 1.65; color: color-mix(in srgb, var(--fg) 78%, transparent); }
.meta{ margin-top: 2px; display:flex; flex-direction:column; gap: 10px; }
.tags{ display:flex; flex-wrap:wrap; gap: 10px; justify-content:flex-end; }
.tag{ border: 1px solid var(--line); padding: 6px 8px; }

.cta{ margin-top: 46px; padding: 56px var(--padX); border: 1px solid var(--strokeLo); text-align:center; background: color-mix(in srgb, var(--bg) 74%, transparent); }
.ctaRow{ margin-top: 18px; display:flex; justify-content:center; flex-wrap:wrap; gap: 12px; }
.ctaRow a{ border: 1px solid var(--strokeLo); padding: 14px 32px; display:inline-flex; align-items:center; }
.ctaRow a.ctaBtn{ border-color: var(--strokeHi); }

@media (max-width: 1024px){
  .grid{ grid-template-columns: 1fr; }
  .card.featured{ grid-column: span 1; }
  .top{ flex-direction:column; align-items:flex-start; }
  .tags{ justify-content:flex-start; }
}
</style>
