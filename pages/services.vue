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
        <h1 class="k title h1">Services</h1>
        <p class="k dim lead">Premium video editing services for creators and studios who want cinematic polish and retention-first structure.</p>
      </div>

      <div class="luxDivider" data-line />

      <!-- Offerings -->
      <div class="grid" data-reveal>
        <div
          v-for="(service, i) in site.services.items"
          :key="service.title"
          class="plaque luxSpot card"
          @mousemove="onSpot"
          @mouseleave="offSpot"
        >
          <div class="k dim2 idx">( {{ String(i + 1).padStart(2, '0') }} )</div>
          <div class="k title st">{{ service.title }}</div>
          <p class="k dim desc">{{ service.desc }}</p>

          <div class="k dim2 sub">Deliverables:</div>
          <ul class="ul">
            <li v-for="b in service.bullets" :key="b" class="k dim li"><span class="k dim2">→</span> {{ b }}</li>
          </ul>
        </div>
      </div>

      <div class="luxDivider" data-line style="margin-top: 46px;" />

      <!-- Packages (keep your existing packages, but present cleaner) -->
      <div class="section" data-reveal>
        <div class="k title h2">Packages</div>
        <div class="pkgGrid">
          <div
            v-for="p in site.services.packages"
            :key="p.title"
            class="plaque luxSpot pkg"
            @mousemove="onSpot"
            @mouseleave="offSpot"
          >
            <div class="k">{{ p.title }}</div>
            <p class="k dim desc" style="margin-top:10px;">{{ p.desc }}</p>
            <ul class="ul" style="margin-top: 12px;">
              <li v-for="b in p.bullets" :key="b" class="k dim li"><span class="k dim2">→</span> {{ b }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="luxDivider" data-line style="margin-top: 46px;" />

      <!-- Process -->
      <div class="section" data-reveal>
        <div class="k title h2">How we work</div>
        <div class="process">
          <div
            v-for="step in site.about.workflow"
            :key="step.step"
            class="plaque proc"
          >
            <div class="k dim2 big">{{ step.step }}</div>
            <div class="k" style="margin-top:8px;">{{ step.title }}</div>
            <div class="k dim2" style="margin-top:8px; font-size:13px; line-height:1.6; text-transform:none; letter-spacing:0.01em;">{{ step.description }}</div>
          </div>
        </div>
      </div>

      <!-- Investment -->
      <div class="plaque luxSpot invest" data-reveal @mousemove="onSpot" @mouseleave="offSpot">
        <div class="k title" style="font-size:24px;">Investment</div>
        <p class="k dim" style="max-width: 680px; margin: 10px auto 0; line-height: 1.7; text-transform:none; letter-spacing:0.01em;">
          Pricing varies by scope, turnaround time, and deliverables. I’ll quote after a quick brief.
        </p>
        <div class="cta">
          <a class="k ctaBtn" :href="`mailto:${site.contact.email}`">Request quote</a>
          <a v-if="site.hero.links.upwork" class="k dim link" :href="site.hero.links.upwork" target="_blank" rel="noreferrer">View Upwork profile</a>
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
.head{ margin-bottom: 18px; }
.h1{ font-size: 32px; margin: 0 0 10px; }
.lead{ max-width: 760px; line-height: 1.7; text-transform:none; letter-spacing:0.01em; margin: 0; }

.grid{ margin-top: 26px; display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; }
.card{ border: 1px solid var(--strokeLo); padding: 18px; background: color-mix(in srgb, var(--bg) 74%, transparent); }
.idx{ font-size: 12px; margin-bottom: 10px; }
.st{ font-size: 20px; margin-bottom: 10px; }
.desc{ font-size: 14px; line-height: 1.7; text-transform:none; letter-spacing:0.01em; margin: 0; }
.sub{ font-size: 12px; margin-top: 14px; }
.ul{ margin: 10px 0 0; padding-left: 0; list-style:none; display:flex; flex-direction:column; gap: 10px; }
.li{ font-size: 13px; display:flex; gap: 10px; align-items:flex-start; }

.section{ margin-top: 40px; }
.h2{ font-size: 24px; margin-bottom: 18px; }

.pkgGrid{ margin-top: 14px; display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
.pkg{ border: 1px solid var(--strokeLo); padding: 18px; background: color-mix(in srgb, var(--bg) 74%, transparent); }

.process{ margin-top: 14px; display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; }
.proc{ border: 1px solid var(--strokeLo); padding: 18px; background: color-mix(in srgb, var(--bg) 74%, transparent); }
.big{ font-size: 32px; opacity: .3; }

.invest{ margin-top: 46px; padding: 56px var(--padX); border: 1px solid var(--strokeLo); text-align:center; background: color-mix(in srgb, var(--bg) 74%, transparent); }
.cta{ margin-top: 18px; display:flex; justify-content:center; flex-wrap:wrap; gap: 12px; }
.cta a{ border: 1px solid var(--strokeLo); padding: 14px 32px; display:inline-flex; align-items:center; }
.cta a.ctaBtn{ border-color: var(--strokeHi); }

@media (max-width: 1024px){
  .grid{ grid-template-columns: 1fr; }
  .pkgGrid{ grid-template-columns: 1fr; }
  .process{ grid-template-columns: 1fr; }
}
</style>
