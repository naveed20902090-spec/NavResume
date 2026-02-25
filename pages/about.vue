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
      <!-- Intro -->
      <div class="intro" data-reveal>
        <div class="k dim2 kicker">{{ site.about.kicker }}</div>
        <h1 class="k title h1">{{ site.about.headline }}</h1>
        <p class="k dim lead">{{ site.description }}</p>
      </div>

      <div class="luxDivider" data-line />

      <!-- Strengths -->
      <div class="section">
        <h2 class="k title h2" data-reveal>What I bring to every edit</h2>

        <div class="grid2">
          <div
            v-for="(s, i) in site.about.strengths"
            :key="s.title"
            class="plaque luxSpot strength"
            data-reveal
            @mousemove="onSpot"
            @mouseleave="offSpot"
          >
            <div class="k dim2 idx">( {{ String(i + 1).padStart(2, '0') }} )</div>
            <div class="k st">{{ s.title }}</div>
            <p class="k dim sd">{{ s.description }}</p>
          </div>
        </div>
      </div>

      <div class="luxDivider" data-line />

      <!-- Workflow -->
      <div class="section">
        <h2 class="k title h2" data-reveal>My workflow</h2>

        <div class="stack">
          <div
            v-for="step in site.about.workflow"
            :key="step.step"
            class="plaque luxSpot workflow"
            data-reveal
            @mousemove="onSpot"
            @mouseleave="offSpot"
          >
            <div class="k step">{{ step.step }}</div>
            <div>
              <div class="k wt">{{ step.title }}</div>
              <p class="k dim wd">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="luxDivider" data-line />

      <!-- Beyond -->
      <div class="section" data-reveal>
        <h2 class="k title h2">Beyond the edit</h2>

        <div class="beyond">
          <div>
            <p class="k dim para">
              I started editing gaming montages in 2018—learning rhythm, pacing, and the power of a perfectly timed cut.
              That foundation evolved into architectural showcases, brand work, and retention-first content.
            </p>
            <p class="k dim para">
              Based in {{ site.location }}, working with creators and studios globally. I specialize in projects that demand precision,
              cinematic polish, and sound design that makes every frame feel intentional.
            </p>
          </div>

          <div>
            <div class="k dim2 label">Tools &amp; Software</div>
            <div class="pillWrap">
              <span v-for="tool in tools" :key="tool" class="k dim pill">{{ tool }}</span>
            </div>

            <div class="k dim2 label" style="margin-top:18px;">Specialties</div>
            <ul class="ul">
              <li v-for="sp in specialties" :key="sp" class="k dim li"><span class="k dim2">→</span> {{ sp }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Connect CTA -->
      <div
        class="plaque luxSpot connect"
        data-reveal
        @mousemove="onSpot"
        @mouseleave="offSpot"
      >
        <div class="k title" style="font-size: 24px;">Let’s connect</div>
        <p class="k dim" style="max-width:540px; margin: 10px auto 0; line-height:1.7;">
          Available for freelance projects, retainer work, and studio partnerships.
        </p>
        <div class="connectRow">
          <a class="k ctaBtn" :href="`mailto:${site.contact.email}`">Email me</a>
          <a class="k dim link" :href="site.hero.links.instagram" target="_blank" rel="noreferrer">Instagram DM</a>
        </div>
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
import { site } from '~/content/site'
import { projects } from '~/composables/useProjects'

const total = computed(() => projects.length)

const tools = [
  'Premiere Pro',
  'After Effects',
  'DaVinci Resolve',
  'Audition / DAW',
  'Photoshop'
]

const specialties = [
  'Gaming montages',
  'Architectural showcases',
  'Podcast editing',
  'Short-form content',
  'Sound design & mixing',
  'Color grading'
]

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

.intro{ margin-bottom: 22px; }
.kicker{ font-size: 13px; margin-bottom: 14px; }
.h1{ font-size: clamp(28px, 5vw, 42px); line-height: 1.2; margin: 0 0 12px; }
.lead{ max-width: 720px; line-height: 1.8; font-size: 16px; margin: 0; text-transform: none; letter-spacing: 0.01em; }

.section{ margin-top: 40px; margin-bottom: 40px; }
.h2{ font-size: 24px; margin: 0 0 18px; }

.grid2{ display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.strength{ border: 1px solid var(--strokeLo); padding: 18px; background: color-mix(in srgb, var(--bg) 74%, transparent); }
.idx{ font-size: 12px; margin-bottom: 10px; }
.st{ font-size: 18px; margin-bottom: 10px; }
.sd{ font-size: 14px; line-height: 1.7; text-transform:none; letter-spacing:0.01em; margin:0; }

.stack{ display:flex; flex-direction:column; gap: 14px; }
.workflow{ border: 1px solid var(--strokeLo); padding: 18px; background: color-mix(in srgb, var(--bg) 74%, transparent); display:grid; grid-template-columns: auto 1fr; gap: 22px; align-items:start; }
.step{ font-size: 32px; opacity: .4; line-height: 1; }
.wt{ font-size: 18px; margin-bottom: 8px; }
.wd{ font-size: 14px; line-height: 1.7; text-transform:none; letter-spacing:0.01em; margin:0; }

.beyond{ display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
.para{ font-size: 14px; line-height: 1.8; text-transform:none; letter-spacing:0.01em; margin: 0 0 12px; }
.label{ font-size: 12px; margin-bottom: 10px; }
.pillWrap{ display:flex; flex-wrap:wrap; gap: 10px; }
.pill{ padding: 8px 16px; border: 1px solid var(--strokeLo); font-size: 12px; }
.ul{ margin: 10px 0 0; padding-left: 0; list-style:none; display:flex; flex-direction:column; gap: 10px; }
.li{ font-size: 13px; display:flex; gap: 10px; align-items:flex-start; }

.connect{ margin-top: 46px; padding: 56px var(--padX); border: 1px solid var(--strokeLo); text-align:center; background: color-mix(in srgb, var(--bg) 74%, transparent); }
.connectRow{ margin-top: 18px; display:flex; justify-content:center; flex-wrap:wrap; gap: 12px; }
.connectRow a{ border: 1px solid var(--strokeLo); padding: 14px 32px; display:inline-flex; align-items:center; }
.connectRow a.ctaBtn{ border-color: var(--strokeHi); }

@media (max-width: 1024px){
  .grid2{ grid-template-columns: 1fr; }
  .beyond{ grid-template-columns: 1fr; }
}
</style>
